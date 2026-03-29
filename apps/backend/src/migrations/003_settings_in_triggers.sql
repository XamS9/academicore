-- ============================================================
-- ACADEMICORE — Settings-aware triggers & SP
-- Run AFTER prisma migrate (system_settings table must exist)
-- Replaces hardcoded values with reads from system_settings.
-- Every read uses COALESCE fallback for safety.
-- ============================================================


-- ─────────────────────────────────────────────
-- 1. FIX: fn_generate_academic_record
--    Read passing_grade from system_settings.
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
  v_passing_grade    NUMERIC;
BEGIN
  -- Read passing grade from system settings (fallback: 60)
  SELECT COALESCE(
    (SELECT passing_grade FROM system_settings LIMIT 1),
    60.0
  ) INTO v_passing_grade;

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

  -- Calculate weighted final grade using normalization
  SELECT SUM(g.score * e.weight) / NULLIF(SUM(e.weight), 0) INTO v_final_grade
  FROM grades g
  JOIN evaluations e ON e.id = g.evaluation_id
  WHERE e.group_id = v_group_id
    AND g.student_id = NEW.student_id;

  v_passed := v_final_grade >= v_passing_grade;

  -- Determine attempt number
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


-- ─────────────────────────────────────────────
-- 2. FIX: fn_update_student_academic_status
--    Read at_risk_threshold from system_settings.
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_update_student_academic_status()
RETURNS TRIGGER AS $$
DECLARE
  v_student           students%ROWTYPE;
  v_failed_count      INT;
  v_mandatory_count   INT;
  v_passed_mandatory  INT;
  v_new_status        "AcademicStatus";
  v_at_risk_threshold INT;
BEGIN
  -- Read AT_RISK threshold from system settings (fallback: 3)
  SELECT COALESCE(
    (SELECT at_risk_threshold FROM system_settings LIMIT 1),
    3
  ) INTO v_at_risk_threshold;

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

  -- Determine new status (use dynamic threshold)
  IF v_mandatory_count > 0 AND v_passed_mandatory >= v_mandatory_count THEN
    v_new_status := 'ELIGIBLE_FOR_GRADUATION';
  ELSIF v_failed_count >= v_at_risk_threshold THEN
    v_new_status := 'AT_RISK';
  ELSE
    v_new_status := 'ACTIVE';
  END IF;

  -- Only update if status actually changed
  IF v_student.academic_status IS DISTINCT FROM v_new_status THEN
    UPDATE students
    SET academic_status = v_new_status,
        updated_at = NOW()
    WHERE id = NEW.student_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ─────────────────────────────────────────────
-- 3. FIX: sp_enroll_student
--    Add -9 validation: max subjects per enrollment.
--    Read max_subjects_per_enrollment from system_settings.
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION sp_enroll_student(
  p_student_id UUID,
  p_group_id   UUID,
  p_period_id  UUID,
  OUT p_result_code    INT,
  OUT p_result_message TEXT
)
RETURNS RECORD AS $$
DECLARE
  v_period         academic_periods%ROWTYPE;
  v_student        students%ROWTYPE;
  v_group          groups%ROWTYPE;
  v_subject_id     UUID;
  v_enrollment_id  UUID;
  v_max_subjects   INT;
  v_current_count  INT;
BEGIN
  -- -1: Academic period not found
  SELECT * INTO v_period FROM academic_periods WHERE id = p_period_id;
  IF NOT FOUND THEN
    p_result_code := -1;
    p_result_message := 'Período académico no encontrado';
    RETURN;
  END IF;

  -- -2: Enrollment not open
  IF NOT v_period.enrollment_open THEN
    p_result_code := -2;
    p_result_message := 'El período no tiene inscripciones abiertas';
    RETURN;
  END IF;

  -- -3: Student not found
  SELECT * INTO v_student FROM students WHERE id = p_student_id AND deleted_at IS NULL;
  IF NOT FOUND THEN
    p_result_code := -3;
    p_result_message := 'Estudiante no encontrado';
    RETURN;
  END IF;

  -- -4: Student not in an enrollable status
  IF v_student.academic_status NOT IN ('ACTIVE', 'AT_RISK', 'ELIGIBLE_FOR_GRADUATION') THEN
    p_result_code := -4;
    p_result_message := 'El estudiante no está en un estado que permita inscripción';
    RETURN;
  END IF;

  -- -5: Group not found or inactive
  SELECT * INTO v_group FROM groups WHERE id = p_group_id AND is_active = TRUE;
  IF NOT FOUND THEN
    p_result_code := -5;
    p_result_message := 'Grupo no encontrado o inactivo';
    RETURN;
  END IF;

  -- -6: No available slots
  IF v_group.current_students >= v_group.max_students THEN
    p_result_code := -6;
    p_result_message := 'El grupo no tiene cupos disponibles';
    RETURN;
  END IF;

  -- -7: Prerequisites not satisfied
  v_subject_id := v_group.subject_id;
  IF EXISTS (
    SELECT 1 FROM subject_prerequisites sp
    WHERE sp.subject_id = v_subject_id
      AND NOT EXISTS (
        SELECT 1
        FROM academic_records ar
        JOIN groups g ON g.id = ar.group_id
        WHERE ar.student_id = p_student_id
          AND g.subject_id = sp.prerequisite_id
          AND ar.passed = TRUE
      )
  ) THEN
    p_result_code := -7;
    p_result_message := 'El estudiante no cumple con los prerrequisitos de la materia';
    RETURN;
  END IF;

  -- -8: Already enrolled in this group
  IF EXISTS (
    SELECT 1
    FROM enrollment_subjects es
    JOIN enrollments e ON e.id = es.enrollment_id
    WHERE e.student_id = p_student_id
      AND es.group_id = p_group_id
      AND es.status = 'ENROLLED'
  ) THEN
    p_result_code := -8;
    p_result_message := 'El estudiante ya está inscrito en este grupo';
    RETURN;
  END IF;

  -- -9: Max subjects per enrollment exceeded
  SELECT COALESCE(
    (SELECT max_subjects_per_enrollment FROM system_settings LIMIT 1),
    7
  ) INTO v_max_subjects;

  SELECT COUNT(*) INTO v_current_count
  FROM enrollment_subjects es
  JOIN enrollments e ON e.id = es.enrollment_id
  WHERE e.student_id = p_student_id
    AND e.academic_period_id = p_period_id
    AND es.status = 'ENROLLED';

  IF v_current_count >= v_max_subjects THEN
    p_result_code := -9;
    p_result_message := 'El estudiante ha alcanzado el máximo de materias por inscripción (' || v_max_subjects || ')';
    RETURN;
  END IF;

  -- 0: Success — create enrollment + subject + increment counter
  BEGIN
    SELECT id INTO v_enrollment_id
    FROM enrollments
    WHERE student_id = p_student_id AND academic_period_id = p_period_id;

    IF NOT FOUND THEN
      INSERT INTO enrollments (id, student_id, academic_period_id, status, enrolled_at, created_at, updated_at)
      VALUES (gen_random_uuid(), p_student_id, p_period_id, 'ACTIVE', NOW(), NOW(), NOW())
      RETURNING id INTO v_enrollment_id;
    END IF;

    INSERT INTO enrollment_subjects (id, enrollment_id, group_id, status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_enrollment_id, p_group_id, 'ENROLLED', NOW(), NOW());

    UPDATE groups
    SET current_students = current_students + 1,
        updated_at = NOW()
    WHERE id = p_group_id;

    p_result_code := 0;
    p_result_message := 'Inscripción exitosa';

  EXCEPTION WHEN OTHERS THEN
    p_result_code := -99;
    p_result_message := 'Error inesperado: ' || SQLERRM;
  END;

END;
$$ LANGUAGE plpgsql;
