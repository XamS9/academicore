-- ============================================================
-- ACADEMICORE — Improvement Migrations
-- Run AFTER prisma migrate (tables must already exist)
-- Addresses: weight normalization, drop SP, classroom overlap,
--            student status auto-update, grade audit trigger
-- ============================================================


-- ─────────────────────────────────────────────
-- 1. FIX: fn_generate_academic_record
--    Normalize weights instead of dividing by 100.
--    Pass threshold changed to 6.0 (0–10 scale).
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_generate_academic_record()
RETURNS TRIGGER AS $$
DECLARE
  v_group_id         UUID;
  v_period_id        UUID;
  v_total_weight     NUMERIC;
  v_graded_weight    NUMERIC;
  v_final_grade      NUMERIC;
  v_passed           BOOLEAN;
  v_attempt          SMALLINT;
BEGIN
  -- Get group_id from the evaluation
  SELECT group_id INTO v_group_id
  FROM evaluations
  WHERE id = NEW.evaluation_id;

  -- Get academic_period_id from the group
  SELECT academic_period_id INTO v_period_id
  FROM groups
  WHERE id = v_group_id;

  -- Total weight defined for this group
  SELECT COALESCE(SUM(weight), 0) INTO v_total_weight
  FROM evaluations
  WHERE group_id = v_group_id;

  -- Weight already graded for this student in this group
  SELECT COALESCE(SUM(e.weight), 0) INTO v_graded_weight
  FROM evaluations e
  INNER JOIN grades g ON g.evaluation_id = e.id AND g.student_id = NEW.student_id
  WHERE e.group_id = v_group_id;

  -- Skip if not all evaluations are graded yet
  IF v_graded_weight < v_total_weight THEN
    RETURN NEW;
  END IF;

  -- Calculate weighted final grade using normalization:
  -- SUM(score * weight) / SUM(weight)
  -- Works regardless of whether weights sum to 1, 100, or any other value.
  SELECT SUM(g.score * e.weight) / NULLIF(SUM(e.weight), 0) INTO v_final_grade
  FROM grades g
  JOIN evaluations e ON e.id = g.evaluation_id
  WHERE e.group_id = v_group_id
    AND g.student_id = NEW.student_id;

  v_passed := v_final_grade >= 6.0;

  -- Determine attempt number (increment on new record, keep on update)
  SELECT COALESCE(
    (SELECT attempt_number FROM academic_records
     WHERE student_id = NEW.student_id AND group_id = v_group_id),
    (SELECT COALESCE(MAX(ar.attempt_number), 0) + 1
     FROM academic_records ar
     JOIN groups g ON g.id = ar.group_id
     WHERE ar.student_id = NEW.student_id
       AND g.subject_id = (SELECT subject_id FROM groups WHERE id = v_group_id))
  ) INTO v_attempt;

  -- Upsert academic_records
  INSERT INTO academic_records (
    id, student_id, group_id, academic_period_id,
    final_grade, passed, attempt_number, generated_at
  )
  VALUES (
    gen_random_uuid(), NEW.student_id, v_group_id, v_period_id,
    v_final_grade, v_passed, COALESCE(v_attempt, 1), NOW()
  )
  ON CONFLICT (student_id, group_id) DO UPDATE
    SET final_grade   = EXCLUDED.final_grade,
        passed        = EXCLUDED.passed,
        generated_at  = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger already exists from 001, no need to recreate
-- (CREATE OR REPLACE on the function is sufficient)


-- ─────────────────────────────────────────────
-- 2. SP: sp_drop_enrollment_subject
--    Validates and atomically drops a student
--    from a group, decrementing the counter.
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION sp_drop_enrollment_subject(
  p_enrollment_subject_id UUID,
  OUT p_result_code    INT,
  OUT p_result_message TEXT
)
RETURNS RECORD AS $$
DECLARE
  v_es          enrollment_subjects%ROWTYPE;
  v_enrollment  enrollments%ROWTYPE;
  v_period      academic_periods%ROWTYPE;
BEGIN
  -- -1: EnrollmentSubject not found
  SELECT * INTO v_es FROM enrollment_subjects WHERE id = p_enrollment_subject_id;
  IF NOT FOUND THEN
    p_result_code := -1;
    p_result_message := 'Inscripción a materia no encontrada';
    RETURN;
  END IF;

  -- -2: Not in ENROLLED status
  IF v_es.status != 'ENROLLED' THEN
    p_result_code := -2;
    p_result_message := 'La materia no está en estado INSCRITO';
    RETURN;
  END IF;

  -- Get enrollment to check the period
  SELECT * INTO v_enrollment FROM enrollments WHERE id = v_es.enrollment_id;

  -- Get the academic period
  SELECT * INTO v_period FROM academic_periods WHERE id = v_enrollment.academic_period_id;

  -- -3: Period not active
  IF NOT v_period.is_active THEN
    p_result_code := -3;
    p_result_message := 'El período académico no está activo';
    RETURN;
  END IF;

  -- -4: Period end date has passed
  IF v_period.end_date < CURRENT_DATE THEN
    p_result_code := -4;
    p_result_message := 'El período académico ya finalizó';
    RETURN;
  END IF;

  -- 0: Success — drop subject + decrement counter
  BEGIN
    UPDATE enrollment_subjects
    SET status = 'DROPPED', updated_at = NOW()
    WHERE id = p_enrollment_subject_id;

    UPDATE groups
    SET current_students = GREATEST(current_students - 1, 0),
        updated_at = NOW()
    WHERE id = v_es.group_id;

    p_result_code := 0;
    p_result_message := 'Baja de materia exitosa';

  EXCEPTION WHEN OTHERS THEN
    p_result_code := -99;
    p_result_message := 'Error inesperado: ' || SQLERRM;
  END;

END;
$$ LANGUAGE plpgsql;


-- ─────────────────────────────────────────────
-- 3. CONSTRAINT: Classroom time overlap prevention
--    Uses btree_gist exclusion to prevent overlapping
--    bookings in the same classroom on the same day.
-- ─────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE group_classrooms
  ADD CONSTRAINT excl_classroom_time_overlap
  EXCLUDE USING gist (
    classroom_id WITH =,
    day_of_week  WITH =,
    tsrange(
      ('2000-01-01'::date + start_time)::timestamp,
      ('2000-01-01'::date + end_time)::timestamp
    ) WITH &&
  );


-- ─────────────────────────────────────────────
-- 4. TRIGGER: fn_update_student_academic_status
--    Fires AFTER INSERT OR UPDATE on academic_records.
--    Auto-transitions student status based on performance.
--    Skips admin-controlled statuses (SUSPENDED, GRADUATED, WITHDRAWN).
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_update_student_academic_status()
RETURNS TRIGGER AS $$
DECLARE
  v_student           students%ROWTYPE;
  v_failed_count      INT;
  v_mandatory_count   INT;
  v_passed_mandatory  INT;
  v_new_status        "AcademicStatus";
BEGIN
  -- Get the student
  SELECT * INTO v_student FROM students WHERE id = NEW.student_id;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Skip admin-controlled statuses
  IF v_student.academic_status IN ('SUSPENDED', 'GRADUATED', 'WITHDRAWN') THEN
    RETURN NEW;
  END IF;

  -- Count subjects with a failed most-recent attempt (no subsequent pass)
  SELECT COUNT(DISTINCT g.subject_id) INTO v_failed_count
  FROM academic_records ar
  JOIN groups g ON g.id = ar.group_id
  WHERE ar.student_id = NEW.student_id
    AND ar.passed = FALSE
    AND NOT EXISTS (
      SELECT 1
      FROM academic_records ar2
      JOIN groups g2 ON g2.id = ar2.group_id
      WHERE ar2.student_id = NEW.student_id
        AND g2.subject_id = g.subject_id
        AND ar2.passed = TRUE
    );

  -- Count mandatory career subjects
  SELECT COUNT(*) INTO v_mandatory_count
  FROM career_subjects
  WHERE career_id = v_student.career_id
    AND is_mandatory = TRUE;

  -- Count passed mandatory career subjects
  SELECT COUNT(DISTINCT cs.subject_id) INTO v_passed_mandatory
  FROM career_subjects cs
  WHERE cs.career_id = v_student.career_id
    AND cs.is_mandatory = TRUE
    AND EXISTS (
      SELECT 1
      FROM academic_records ar
      JOIN groups g ON g.id = ar.group_id
      WHERE ar.student_id = NEW.student_id
        AND g.subject_id = cs.subject_id
        AND ar.passed = TRUE
    );

  -- Determine new status
  IF v_mandatory_count > 0 AND v_passed_mandatory >= v_mandatory_count THEN
    v_new_status := 'ELIGIBLE_FOR_GRADUATION';
  ELSIF v_failed_count >= 3 THEN
    v_new_status := 'AT_RISK';
  ELSE
    v_new_status := 'ACTIVE';
  END IF;

  -- Only update if status actually changed (prevent infinite trigger loops)
  IF v_student.academic_status IS DISTINCT FROM v_new_status THEN
    UPDATE students
    SET academic_status = v_new_status,
        updated_at = NOW()
    WHERE id = NEW.student_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_update_student_status
  AFTER INSERT OR UPDATE ON academic_records
  FOR EACH ROW EXECUTE FUNCTION fn_update_student_academic_status();


-- ─────────────────────────────────────────────
-- 5. TRIGGER: fn_audit_grade_update
--    Fires AFTER UPDATE on grades.
--    Writes to audit_logs when score changes.
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_audit_grade_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.score IS DISTINCT FROM NEW.score THEN
    INSERT INTO audit_logs (
      id, entity_type, entity_id, action,
      performed_by, old_values, new_values, created_at
    ) VALUES (
      gen_random_uuid(),
      'grade',
      NEW.id,
      'UPDATED',
      NEW.graded_by,
      jsonb_build_object(
        'score', OLD.score,
        'student_id', OLD.student_id,
        'evaluation_id', OLD.evaluation_id,
        'graded_by', OLD.graded_by
      ),
      jsonb_build_object(
        'score', NEW.score,
        'student_id', NEW.student_id,
        'evaluation_id', NEW.evaluation_id,
        'graded_by', NEW.graded_by
      ),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_audit_grade_update
  AFTER UPDATE ON grades
  FOR EACH ROW EXECUTE FUNCTION fn_audit_grade_update();
