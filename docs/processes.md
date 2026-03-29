# Business Processes — Academicore

This document describes every business process the application currently handles. It must be kept up to date whenever a process is added, modified, or removed.

---

## 1. Authentication & Session Management

**Actors:** All users (public)

| Step | Description |
|------|-------------|
| 1 | User submits email + password to `POST /api/auth/login` |
| 2 | System verifies credentials (bcrypt), checks user is active and not soft-deleted |
| 3 | Returns JWT access token (short-lived) + refresh token (long-lived) + user info |
| 4 | Frontend stores tokens in localStorage, attaches Bearer token on every request |
| 5 | On 401, frontend redirects to `/login` |

**Refresh flow:** `POST /api/auth/refresh` exchanges a valid refresh token for a new access token.

---

## 2. User Management

**Actors:** ADMIN

CRUD on the `User` entity (supertype for Student/Teacher/Admin).

| Operation | Endpoint | Notes |
|-----------|----------|-------|
| List | `GET /api/usuarios` | Includes roles |
| Get | `GET /api/usuarios/:id` | Full user with roles |
| Create | `POST /api/usuarios` | Hashes password (bcrypt 10 rounds), assigns userType |
| Update | `PATCH /api/usuarios/:id` | firstName, lastName, email |
| Delete | `DELETE /api/usuarios/:id` | Soft delete (sets `deletedAt`) |
| Toggle active | `PATCH /api/usuarios/:id/toggle-active` | Enables/disables login |

**Rules:** Email must be unique. Deleted/inactive users cannot log in.

---

## 3. Student Lifecycle Management

**Actors:** ADMIN (full CRUD), TEACHER (read), STUDENT (read own)

| Operation | Endpoint | Notes |
|-----------|----------|-------|
| List | `GET /api/estudiantes` | With user & career |
| Get | `GET /api/estudiantes/:id` | Full profile |
| Get by user | `GET /api/estudiantes/by-user/:userId` | Lookup by user FK |
| Create | `POST /api/estudiantes` | Requires userId, studentCode, careerId |
| Update | `PATCH /api/estudiantes/:id` | Includes academicStatus transitions |
| Delete | `DELETE /api/estudiantes/:id` | Soft delete |

**Academic statuses:** ACTIVE, AT_RISK, ELIGIBLE_FOR_GRADUATION, SUSPENDED, GRADUATED, WITHDRAWN.

---

## 4. Teacher Management

**Actors:** ADMIN (full CRUD), TEACHER (read own)

| Operation | Endpoint | Notes |
|-----------|----------|-------|
| List | `GET /api/profesores` | With user details |
| Get | `GET /api/profesores/:id` | Includes groups taught |
| Get by user | `GET /api/profesores/by-user/:userId` | Lookup by user FK |
| Create | `POST /api/profesores` | Requires userId, employeeCode |
| Update | `PATCH /api/profesores/:id` | Department, etc. |
| Delete | `DELETE /api/profesores/:id` | Soft delete |

**Rules:** Employee code must be unique. One-to-one with User.

---

## 5. Career Management

**Actors:** ADMIN (full CRUD), TEACHER/STUDENT (read)

| Operation | Endpoint | Notes |
|-----------|----------|-------|
| List | `GET /api/carreras` | Basic list |
| Get | `GET /api/carreras/:id` | Includes CareerSubjects with subject details |
| Create | `POST /api/carreras` | name, code (unique), totalSemesters |
| Update | `PATCH /api/carreras/:id` | Any field |
| Delete | `DELETE /api/carreras/:id` | Soft delete |
| Toggle active | `PATCH /api/carreras/:id/toggle-active` | Enable/disable |

A career has many subjects via the `CareerSubject` bridge (semesterNumber, isMandatory).

---

## 6. Subject & Prerequisite Management

**Actors:** ADMIN (full CRUD), TEACHER/STUDENT (read)

| Operation | Endpoint | Notes |
|-----------|----------|-------|
| List | `GET /api/materias` | Includes prerequisites |
| Get | `GET /api/materias/:id` | Both "prereqs of this" and "is prereq for" |
| Create | `POST /api/materias` | name, code (unique), credits |
| Update | `PATCH /api/materias/:id` | Any field |
| Delete | `DELETE /api/materias/:id` | Soft delete |
| Add prerequisite | `POST /api/materias/:id/prerequisites` | Links subject to prereq |
| Remove prerequisite | `DELETE /api/materias/:id/prerequisites/:prereqId` | Removes link |

**Rules:** Subject codes are globally unique. Prerequisites form a directed graph checked at enrollment time.

---

## 7. Academic Period Management

**Actors:** ADMIN (full CRUD + toggle), TEACHER/STUDENT (read)

| Operation | Endpoint | Notes |
|-----------|----------|-------|
| List | `GET /api/periodos` | All periods |
| Active | `GET /api/periodos/active` | Only isActive=true |
| Get | `GET /api/periodos/:id` | Full details |
| Create | `POST /api/periodos` | name, startDate, endDate, enrollmentOpen |
| Update | `PATCH /api/periodos/:id` | Dates, name |
| Toggle enrollment | `PATCH /api/periodos/:id/toggle-enrollment` | Opens/closes enrollment window |

**Rules:** `enrollmentOpen` gates student enrollment. `isActive` marks the current semester.

---

## 8. Classroom Management

**Actors:** ADMIN (full CRUD), TEACHER/STUDENT (read)

| Operation | Endpoint | Notes |
|-----------|----------|-------|
| List | `GET /api/aulas` | Active classrooms |
| Get | `GET /api/aulas/:id` | Details |
| Create | `POST /api/aulas` | name, building, capacity |
| Update | `PATCH /api/aulas/:id` | Any field |
| Toggle active | `PATCH /api/aulas/:id/toggle-active` | Enable/disable |
| Delete | `DELETE /api/aulas/:id` | Soft delete |

Classrooms are assigned to groups via the scheduling process (see Process 9).

---

## 9. Group & Schedule Management

**Actors:** ADMIN (full CRUD + scheduling), TEACHER (read own groups), STUDENT (read enrolled groups)

### Group CRUD

| Operation | Endpoint | Notes |
|-----------|----------|-------|
| List | `GET /api/grupos?periodId=` | Optional period filter |
| Get | `GET /api/grupos/:id` | Includes subject, teacher, classrooms, period |
| By teacher | `GET /api/grupos/teacher/:teacherId` | Teacher's groups |
| Create | `POST /api/grupos` | subjectId, periodId, teacherId, groupCode, maxStudents |
| Update | `PATCH /api/grupos/:id` | maxStudents, groupCode |
| Toggle active | `PATCH /api/grupos/:id/toggle-active` | Enable/disable |

### Classroom Scheduling

| Step | Description |
|------|-------------|
| 1 | Admin submits classroomId, dayOfWeek (0-6), startTime, endTime for a group |
| 2 | System checks for **room conflicts** (same classroom, same day, overlapping times) |
| 3 | System checks for **teacher conflicts** (same teacher, same day, overlapping times) |
| 4 | If conflict found: returns 409 with message |
| 5 | If clear: creates `GroupClassroom` record |

**Endpoint:** `POST /api/grupos/:id/classrooms`

---

## 10. Student Enrollment (Core Process)

**Actors:** ADMIN

**Endpoint:** `POST /api/inscripciones/enroll`

This process is handled by the `sp_enroll_student` stored procedure to guarantee atomicity.

| Step | Validation | Error code |
|------|------------|------------|
| 1 | Academic period exists | -1 |
| 2 | Period has `enrollmentOpen = true` | -2 |
| 3 | Student exists and not soft-deleted | -3 |
| 4 | Student status in {ACTIVE, AT_RISK, ELIGIBLE_FOR_GRADUATION} | -4 |
| 5 | Group exists and `isActive = true` | -5 |
| 6 | Group has capacity (`currentStudents < maxStudents`) | -6 |
| 7 | Student has passed all prerequisite subjects (via `academic_records.passed`) | -7 |
| 8 | Student not already enrolled in this group | -8 |

**On success (code 0):**
- Creates or retrieves `Enrollment` record for the student+period
- Creates `EnrollmentSubject` record (status = ENROLLED)
- Increments `group.currentStudents`

### Subject Drop

**Endpoint:** `PATCH /api/inscripciones/drop` — calls `sp_drop_enrollment_subject` stored procedure.

### Read Operations

| Endpoint | Roles |
|----------|-------|
| `GET /api/inscripciones/student/:studentId` | All authenticated |
| `GET /api/inscripciones/period/:periodId` | ADMIN |

---

## 11. Assessment & Grading (Core Process)

**Actors:** ADMIN, TEACHER (CRUD); STUDENT (read own)

### Evaluation Types

| Operation | Endpoint |
|-----------|----------|
| List | `GET /api/tipos-evaluaciones` |
| Create | `POST /api/tipos-evaluaciones` |

Types: Examen, Practica, Proyecto, etc.

### Evaluations (per group)

| Operation | Endpoint | Notes |
|-----------|----------|-------|
| By group | `GET /api/evaluaciones/group/:groupId` | All evaluations |
| Get | `GET /api/evaluaciones/:id` | With type details |
| Create | `POST /api/evaluaciones` | Validates weight sum <= 100 per group |
| Update | `PATCH /api/evaluaciones/:id` | Re-validates weight sum |
| Delete | `DELETE /api/evaluaciones/:id` | Hard delete |

**Rule:** Sum of evaluation weights per group must not exceed 100%.

### Grades

| Operation | Endpoint | Notes |
|-----------|----------|-------|
| By evaluation | `GET /api/calificaciones/evaluation/:evaluationId` | All grades for one assessment |
| By student+group | `GET /api/calificaciones/student/:studentId/group/:groupId` | Student grades in group |
| Record | `POST /api/calificaciones` | Upsert (evaluationId, studentId, score) |
| Bulk record | `POST /api/calificaciones/bulk` | Transactional array upsert |

**Rule:** Score stored as decimal(5,2). `gradedBy` captures the user who entered the grade.

---

## 12. Academic Record Generation (Automated)

**Trigger:** `fn_generate_academic_record` — fires AFTER INSERT OR UPDATE on `grades`.

| Step | Description |
|------|-------------|
| 1 | Get groupId from the evaluation |
| 2 | Get academicPeriodId from the group |
| 3 | Calculate total weight of all evaluations in the group |
| 4 | Calculate weight already graded for this student |
| 5 | If `graded_weight < total_weight` → EXIT (wait for remaining grades) |
| 6 | Calculate weighted final grade: `SUM(score * weight / 100.0)` |
| 7 | Determine `passed = (finalGrade >= 60.00)` |
| 8 | Determine attemptNumber (increment on retry, keep on update) |
| 9 | UPSERT into `academic_records` |

### Read Operations

| Endpoint | Description |
|----------|-------------|
| `GET /api/academic-records/student/:studentId` | All records |
| `GET /api/academic-records/student/:studentId/period/:periodId` | Records by period |
| `GET /api/academic-records/student/:studentId/averages` | Credit-weighted GPA per period |
| `GET /api/academic-records/student/:studentId/passed` | Passed subjects only |
| `GET /api/academic-records/student/:studentId/failed` | Failed subjects only |

**Rules:** Final grade only generated when ALL evaluations are graded. Pass threshold: >= 60.00. GPA: `SUM(grade * credits) / SUM(credits)`.

---

## 13. Certification & Credential Issuance (Core Process)

**Actors:** ADMIN (issue/revoke/manage criteria), STUDENT (read own), PUBLIC (verify)

### Certification Types
- **DEGREE** — career-specific, requires all mandatory subjects + GPA + credits
- **TRANSCRIPT** — GPA-based
- **ENROLLMENT_PROOF** — current enrollment
- **COMPLETION** — generic completion

### Criteria Management

| Operation | Endpoint |
|-----------|----------|
| List criteria | `GET /api/certificaciones/criteria` |
| Create criteria | `POST /api/certificaciones/criteria` |

Each criteria defines: certificationType, careerId (optional), minGrade, validityMonths, minCredits, requireAllMandatory.

### Issue Certificate

**Endpoint:** `POST /api/certificaciones/issue`

| Step | Description |
|------|-------------|
| 1 | Fetch `CertificationCriteria` for the requested type |
| 2 | Calculate student's cumulative credit-weighted GPA |
| 3 | If `minGrade` set: verify GPA >= minGrade |
| 4 | If `requireAllMandatory` and careerId: verify all mandatory subjects passed |
| 5 | If `minCredits` set: verify total passed credits >= minCredits |
| 6 | Generate unique `verificationCode` (UUID) |
| 7 | Generate `documentHash` = SHA256(JSON.stringify({dto, issuedAt, issuedBy})) |
| 8 | Calculate `expiresAt` = now + validityMonths |
| 9 | Create certification with status = ACTIVE |
| 10 | Create audit log entry (action = ISSUED) |

### Other Operations

| Operation | Endpoint | Notes |
|-----------|----------|-------|
| Verify (public) | `GET /api/certificaciones/verify/:code` | No auth required |
| List all | `GET /api/certificaciones` | ADMIN |
| By student | `GET /api/certificaciones/student/:studentId` | Authenticated |
| Revoke | `POST /api/certificaciones/:id/revoke` | ADMIN, sets status=REVOKED + reason |
| Download PDF | `GET /api/certificaciones/:id/pdf` | Authenticated |

---

## 14. Audit Logging

**Actors:** ADMIN (read-only)

Append-only log capturing changes across the system.

| Field | Description |
|-------|-------------|
| entityType | Which model was affected |
| entityId | UUID of the affected record |
| action | CREATED, UPDATED, DELETED, REVOKED, ISSUED, ENROLLED, DROPPED, STATUS_CHANGE |
| performedBy | UserId of actor (nullable) |
| oldValues / newValues | JSONB snapshots |
| ipAddress | Request origin |

| Endpoint | Description |
|----------|-------------|
| `GET /api/auditoria` | Latest 50, filterable by entityType |
| `GET /api/auditoria/entity/:entityType/:entityId` | History of a single entity |

**Rules:** No updates or deletes allowed — append-only for compliance.

---

## 15. Course Content Management

**Actors:** ADMIN (full CRUD on all groups), TEACHER (CRUD on own groups), STUDENT (read-only on enrolled groups)

Content is organized per **Group** (not per Subject), so each teacher customizes their own section's materials.

### Topics (syllabus sections)

| Operation | Endpoint | Roles |
|-----------|----------|-------|
| List by group | `GET /api/topics/group/:groupId` | All authenticated |
| Get | `GET /api/topics/:id` | All authenticated |
| Create | `POST /api/topics` | ADMIN, TEACHER |
| Update | `PATCH /api/topics/:id` | ADMIN, TEACHER |
| Delete | `DELETE /api/topics/:id` | ADMIN, TEACHER (cascades content items) |
| Reorder | `PATCH /api/topics/group/:groupId/reorder` | ADMIN, TEACHER |

Topics have a `sortOrder` (unique per group) and optional description.

### Content Items (materials within a topic)

| Operation | Endpoint | Roles |
|-----------|----------|-------|
| List by topic | `GET /api/content-items/topic/:topicId` | All authenticated |
| Get | `GET /api/content-items/:id` | All authenticated |
| Create | `POST /api/content-items` | ADMIN, TEACHER |
| Update | `PATCH /api/content-items/:id` | ADMIN, TEACHER |
| Delete | `DELETE /api/content-items/:id` | ADMIN, TEACHER |

Each content item has a `type` field:
- **TEXT** — plain text notes or descriptions
- **LINK** — URL to an external resource
- **FILE_REF** — reference/URL to a file (no upload — just a pointer)

**Rules:**
- Topics and content items use `sortOrder` with a unique constraint per parent for ordering
- Deleting a topic cascades to delete all its content items
- Hard deletes (no soft delete — content is ephemeral per semester)

---

## 16. System Settings Management

**Actors:** ADMIN (read/write), TEACHER/STUDENT (read)

Single-row configuration table that controls system-wide academic parameters. Previously hardcoded values are now admin-configurable.

### Settings

| Setting | Field | Default | Description |
|---------|-------|---------|-------------|
| Passing Grade | `passingGrade` | 60 | Minimum grade to pass a subject (0–100 scale). Used by DB trigger `fn_generate_academic_record`. |
| Max Subjects per Enrollment | `maxSubjectsPerEnrollment` | 7 | Maximum subjects a student can enroll in per academic period. Enforced by `sp_enroll_student`. |
| Max Evaluation Weight | `maxEvaluationWeight` | 100 | Maximum sum of evaluation weights per group. Enforced by the evaluations service. |
| AT_RISK Threshold | `atRiskThreshold` | 3 | Number of failed subjects that triggers AT_RISK status. Used by DB trigger `fn_update_student_academic_status`. |

### Operations

| Operation | Endpoint | Roles |
|-----------|----------|-------|
| Get settings | `GET /api/configuracion` | All authenticated |
| Update settings | `PATCH /api/configuracion` | ADMIN |

**Rules:**
- Exactly one row exists (seeded on first run, no create/delete via API)
- SQL triggers read from `system_settings` with `COALESCE` fallbacks for safety
- Changes take effect immediately for new operations (no restart needed)
- `updatedBy` tracks which admin last modified settings

---

## Not Implemented

The following academic processes are **not** currently handled:
- **Attendance tracking** — no attendance records
- **Student self-enrollment** — enrollment is admin-only; no student-facing enrollment flow
- **Notifications / messaging** — no email, in-app notifications, or announcements
- **Tuition / payments** — no financial management
- **Faculty workload / contracts** — no HR-related processes
- **Library / resources** — no resource management
- **Transfer credits** — no mechanism for external credit recognition
- **Academic calendar events** — periods exist but no event/holiday management
