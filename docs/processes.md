# Business Processes — Academicore

This document describes every business process the application currently handles. It must be kept up to date whenever a process is added, modified, or removed.

---

## 1. Authentication & Session Management

**Actors:** All users (public)

| Step | Description |
|------|-------------|
| 1 | User submits email + password to `POST /api/auth/login` |
| 2 | System verifies credentials (bcrypt), checks user is active (`isActive=true`) and not soft-deleted |
| 3 | Returns JWT access token (short-lived) + refresh token (long-lived) + user info |
| 4 | Frontend stores tokens in localStorage, attaches Bearer token on every request |
| 5 | On 401, frontend redirects to `/login` |

**Refresh flow:** `POST /api/auth/refresh` exchanges a valid refresh token for a new access token.

**Login page:** Includes a "¿Eres nuevo? Crear cuenta" link to `/registro` for student self-registration.

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

**Frontend:** All user types are managed from a single `/usuarios` page. A `ToggleButtonGroup` filter (Todos / Administradores / Docentes / Estudiantes) switches the table columns, row actions, and create/edit forms to the appropriate type. The separate `/estudiantes` and `/profesores` routes redirect to `/usuarios`.

---

## 3. Student Lifecycle Management

**Actors:** ADMIN (full CRUD), TEACHER (read), STUDENT (read own)

| Operation | Endpoint | Notes |
|-----------|----------|-------|
| List | `GET /api/estudiantes` | With user (id, name, email, isActive) & career (id, name) |
| Get | `GET /api/estudiantes/:id` | Full profile |
| Get by user | `GET /api/estudiantes/by-user/:userId` | Lookup by user FK |
| Self-register | `POST /api/auth/register` | Public — see Process 1a below |
| Admin create | `POST /api/usuarios` (userType=STUDENT) | Admin creates from the Estudiantes filter on `/usuarios`; backend auto-generates student profile |
| Update user fields | `PATCH /api/usuarios/:userId` | firstName, lastName, email — called in parallel with student update |
| Update student fields | `PATCH /api/estudiantes/:id` | academicStatus, careerId (optional) |
| Approve | `PATCH /api/estudiantes/:id/approve` | Sets `User.isActive=true` + `academicStatus=ACTIVE` atomically |
| Delete | `DELETE /api/estudiantes/:id` | Soft delete (also used to reject a pending registration) |

**Academic statuses:** PENDING, ACTIVE, AT_RISK, ELIGIBLE_FOR_GRADUATION, SUSPENDED, GRADUATED, WITHDRAWN.
- `PENDING` — set on self-registered students awaiting admin approval; user login is blocked (`isActive=false`)
- All other transitions are manual admin actions via the edit dialog

**Frontend admin create flow:** With the Estudiantes filter active on `/usuarios`, "Nuevo Usuario" opens a unified create form with role selector. Setting role to Estudiante and saving calls `POST /api/usuarios` with `userType: "STUDENT"`.

**Frontend edit flow:** The edit dialog shows Nombre, Apellido, Correo, Código (read-only), Estado académico, and Carrera. The career selector is locked by default — admin must click the lock icon to unlock it, which displays a warning about academic history impact. Saving fires two parallel requests: `PATCH /api/usuarios/:userId` and `PATCH /api/estudiantes/:id`.

**Frontend approve flow:** PENDING students show a green checkmark button in the Estudiantes table and on the `/solicitudes-registro` page. One click calls `PATCH /api/estudiantes/:id/approve`.

---

## 3a. Student Self-Registration

**Actors:** Public (unauthenticated)

| Step | Description |
|------|-------------|
| 1 | Prospective student visits `/registro` (public page, no auth required) |
| 2 | Step 1 — fills in firstName, lastName, email, password (min 6 chars) |
| 3 | Step 2 — selects a career from the active careers grid (fetched from the now-public `GET /api/carreras`) |
| 4 | Step 3 — reviews a summary and submits |
| 5 | `POST /api/auth/register` creates User (`isActive=false`) + Student (`academicStatus=PENDING`, auto-generated `studentCode`) in one transaction |
| 6 | Success screen informs student their account is pending approval |
| 7 | Admin reviews the request at `/solicitudes-registro`, approves or rejects |
| 8 | On approval: `PATCH /api/estudiantes/:id/approve` sets `isActive=true` + `academicStatus=ACTIVE` atomically |
| 9 | Student can now log in |

**Rules:** Email must be unique. Duplicate email returns HTTP 409. Career must be active. Student cannot log in until approved (`isActive=false` blocks login).

---

## 4. Teacher Management

**Actors:** ADMIN (full CRUD), TEACHER (read own)

| Operation | Endpoint | Notes |
|-----------|----------|-------|
| List | `GET /api/profesores` | With full user object (id, name, email, …) |
| Get | `GET /api/profesores/:id` | Includes groups taught |
| Get by user | `GET /api/profesores/by-user/:userId` | Lookup by user FK |
| Create | `POST /api/usuarios` (userType=TEACHER) | Admin creates from the Docentes filter on `/usuarios`; role locked to TEACHER; backend auto-generates teacher profile |
| Update user fields | `PATCH /api/usuarios/:userId` | firstName, lastName, email — called in parallel with teacher update |
| Update teacher fields | `PATCH /api/profesores/:id` | employeeCode, department |
| Delete | `DELETE /api/profesores/:id` | Soft delete |

**Rules:** Employee code must be unique. One-to-one with User. Department is selected from the predefined `departments` catalogue (see Process 23).

**Frontend create flow:** With the Docentes filter active on `/usuarios`, the "Nuevo Docente" button opens a user-creation form (Nombre, Apellido, Correo, Contraseña) with the role field pre-set to "Docente" and disabled.

**Frontend edit flow:** The edit dialog shows Nombre, Apellido, Correo, Código de empleado, and a Departamento dropdown populated from `GET /api/departments`. Saving fires two parallel requests: `PATCH /api/usuarios/:userId` and `PATCH /api/profesores/:id`.

---

## 5. Career Management

**Actors:** ADMIN (full CRUD), TEACHER/STUDENT (read)

| Operation | Endpoint | Notes |
|-----------|----------|-------|
| List | `GET /api/carreras` | Basic list — **public, no auth required** (needed for self-registration) |
| Get | `GET /api/carreras/:id` | Includes CareerSubjects with subject details — **public, no auth required** |
| Create | `POST /api/carreras` | name, code (unique), totalSemesters |
| Update | `PATCH /api/carreras/:id` | Any field |
| Delete | `DELETE /api/carreras/:id` | Soft delete |
| Toggle active | `PATCH /api/carreras/:id/toggle-active` | Enable/disable |
| Add subject to plan | `POST /api/carreras/:id/subjects` | ADMIN — body: `subjectId`, `semesterNumber`, `isMandatory` |
| Update plan row | `PATCH /api/carreras/:id/subjects/:subjectId` | ADMIN — `semesterNumber` / `isMandatory` |
| Remove from plan | `DELETE /api/carreras/:id/subjects/:subjectId` | ADMIN |

A career has many subjects via the `CareerSubject` bridge (semesterNumber, isMandatory).

**Frontend:** On `/carreras`, the **plan de estudios** action (icono de libro) opens a dialog to list, add, and remove materias for that carrera. La pantalla `/materias` solo define catálogo global; el vínculo carrera↔materia se gestiona aquí.

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

**Fase de calificación vs inscripciones:** Cuando `status = GRADING`, las inscripciones deben estar siempre cerradas (`enrollmentOpen = false`). La fase de calificación ocurre al **final** del ciclo; no puede activarse con inscripciones abiertas. Al pasar a `GRADING` (`start-grading`), el sistema cierra inscripciones automáticamente. No se permite abrir inscripciones ni alternarlas mientras el período está en `GRADING`; cualquier `PATCH` que intente `enrollmentOpen: true` en ese estado es rechazado, y si hubiera datos inconsistentes se corrige a cerrado al guardar.

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

**Actors:** ADMIN (full CRUD + scheduling), TEACHER (read own groups + manage content/evaluations/grades via group detail page), STUDENT (read enrolled groups)

### Group CRUD

| Operation | Endpoint | Notes |
|-----------|----------|-------|
| List | `GET /api/grupos?periodId=` | Optional period filter |
| Get | `GET /api/grupos/:id` | Includes subject, teacher, classrooms, period |
| By teacher | `GET /api/grupos/teacher/:teacherId` | Teacher's groups |
| Students in group | `GET /api/grupos/:id/students` | Enrolled students (status=ENROLLED) for grade entry |
| Create | `POST /api/grupos` | `subjectId`, `academicPeriodId`, `teacherId`, `maxStudents`, optional `groupCode` (vacío = auto: prefijo desde código/nombre de materia + secuencia por materia/período), optional `deliveryMode` (`ON_SITE` \| `VIRTUAL` \| `HYBRID`, default presencial) |
| Update | `PATCH /api/grupos/:id` | `maxStudents`, optional `groupCode`, optional `deliveryMode` |
| Toggle active | `PATCH /api/grupos/:id/toggle-active` | Enable/disable |

### Teacher Group Hub (Frontend UX)

Teachers access all group-specific actions from a dedicated **Group Detail Page** reachable from **Mis Grupos**. The list page shows each group with a "Ver Detalles" button that navigates to `/mis-grupos/:groupId`. The detail page has three tabs:

| Tab | Content |
|-----|---------|
| Evaluaciones | Evaluation table + create/edit/delete + submissions viewer with inline grade entry |
| Calificaciones | Grade matrix for all enrolled students across all evaluations |
| Contenido | Topic accordion + content item CRUD |

The **Evaluaciones** tab includes a submissions viewer dialog (opened per evaluation) that shows each enrolled student's submission content (text, link, or file) and a grade input field next to each row. Teachers can review submissions and enter grades in one view, then save all grades with a single button.

The separate `/contenido`, `/evaluaciones`, and `/calificaciones` routes remain available for ADMIN users with their group-dropdown selectors. They are no longer shown in the TEACHER sidebar.

### Classroom Scheduling

| Step | Description |
|------|-------------|
| 1 | Admin submits `classroomId`, `dayOfWeek` (1=Lunes … 7=Domingo), `startTime`, `endTime` (`HH:mm`) for a group |
| 2 | System checks for **room conflicts** (same classroom, same day, overlapping times) |
| 3 | System checks for **teacher conflicts** (same teacher, same day, overlapping times) |
| 4 | If conflict found: returns 409 with message |
| 5 | If clear: creates `GroupClassroom` record |

**Endpoint:** `POST /api/grupos/:id/classrooms`

**Frontend:** On `/grupos`, **Aulas y horario** (icono de calendario) lists `GroupClassroom` slots and adds new ones. Grupos con modalidad **virtual** no requieren aula física; **mixto** puede combinar bloques presenciales y actividad en línea (la modalidad es informativa/reglamentaria).

### Modalidad presencial / virtual

Each `Group` has `deliveryMode`: **ON_SITE** (presencial), **VIRTUAL** (sin sede), **HYBRID** (mixto). No sustituye el horario en `group_classrooms` para aulas físicas; sirve para reglas de negocio y UX (p. ej. ocultar asignación de aula si es solo virtual).

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
| By evaluation | `GET /api/grades/evaluation/:evaluationId` | All grades for one assessment |
| My grades in group (current) | `GET /api/grades/me/group/:groupId` | STUDENT only; requires active `enrollment_subject.status = ENROLLED` |
| My grades in group (historial) | `GET /api/grades/me/group/:groupId/history` | STUDENT only; any non-`DROPPED` enrollment for that group (e.g. COMPLETED/FAILED) — used by **Historial de calificaciones** |
| By student+group | `GET /api/grades/student/:studentId/group/:groupId` | ADMIN/TEACHER unrestricted; STUDENT only if `ENROLLED` in group |
| Record | `POST /api/grades` | Upsert (evaluationId, studentId, score) |
| Bulk record | `POST /api/grades/bulk` | Transactional array upsert |

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
- **DEGREE** — career-specific (criteria row with `careerId`): typically `requireAllMandatory`, `minGrade`, `minCredits`
- **TRANSCRIPT** — historial / expediente; eligibility from criteria (GPA, credits)
- **COMPLETION** — constancia de terminación; also the type used when **auto-issuing** after all mandatory career subjects are passed (see `grades.service` → `checkAndAutoIssueCertifications`)

Enrollment status is **not** a certification type: inscripción vigente se consulta en **Mi inscripción** / datos de matrícula, no como certificado verificable.

**Not implemented:** certificados ligados a un **conjunto arbitrario de materias** o a **una sola materia** definida al crear el criterio (habría que extender el modelo, p. ej. tabla de requisitos por materia o por lista de `subject_id`).

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

**Actors:** ADMIN (full CRUD on all groups), TEACHER (CRUD on own groups), STUDENT (read-only on enrolled groups with paid inscription fee)

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

Topics have a `sortOrder` (unique per group), optional description, and an optional `weekNumber` that maps the topic to a specific week of the academic period.

**Week-based organization:** When `weekNumber` is set, the UI groups topics under a week header showing the calendar date range automatically computed from the period's `startDate` (Week N starts at `startDate + (N-1)*7 days`). No manual date entry is needed — dates update automatically when content is reused in a new period.

**Automatic content cloning on group creation:** When a new group is created (`POST /api/grupos`), the system automatically looks for the most recently created group for the same subject that has topics. If found, all its topics and content items are cloned into the new group, preserving `weekNumber`, `sortOrder`, title, description, and material content. The week-based dates auto-derive from the new period's `startDate`. No teacher action is required — the new group is ready to use immediately.

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

The UI shows each item's `createdAt` as "Publicado el DD MMM YYYY" for both teachers and students.

**Rules:**
- Topics and content items use `sortOrder` with a unique constraint per parent for ordering
- Deleting a topic cascades to delete all its content items
- Hard deletes (no soft delete — content is ephemeral per semester)
- Auto-clone on group creation replaces any pre-existing topics in the new group (new groups are empty, so this is always a fresh copy)
- Student access to topics/content/evaluations/submissions for a group requires `ENROLLED` status **and** the period's inscription fee in `PAID` status. If unpaid, API returns 403 and content remains locked.

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

## 17. In-App Notifications

**Actors:** All authenticated users (read own), System (creates via services)

Polling-based notification system. Other services create notifications as side effects (enrollment, grading, payments, announcements, certifications).

### Notification Types

`GRADE_POSTED`, `ENROLLMENT_CONFIRMED`, `CERTIFICATION_ISSUED`, `ANNOUNCEMENT`, `PAYMENT_DUE`, `PAYMENT_CONFIRMED`, `GENERAL`

### Operations

| Operation | Endpoint | Roles |
|-----------|----------|-------|
| List own | `GET /api/notifications?unreadOnly&limit&offset` | Authenticated |
| Unread count | `GET /api/notifications/unread-count` | Authenticated |
| Mark read | `PATCH /api/notifications/:id/read` | Authenticated (own only) |
| Mark all read | `PATCH /api/notifications/read-all` | Authenticated |

### Integration Points

| Trigger | Source service | Type |
|---------|---------------|------|
| Grade posted | `grades.service` → `bulkUpsert()` | `GRADE_POSTED` |
| Enrollment confirmed | `enrollments.service` → `enrollStudent()` | `ENROLLMENT_CONFIRMED` |
| Certification issued | `certifications.service` → `issue()` | `CERTIFICATION_ISSUED` |
| Announcement published | `announcements.service` → `create()` | `ANNOUNCEMENT` |
| Fee assigned | `payments.service` → `assignFee()` | `PAYMENT_DUE` |
| Payment confirmed | `payments.service` → `pay()` | `PAYMENT_CONFIRMED` |

**Frontend:** Bell icon with badge in TopBar, polls unread count every 30 seconds.

---

## 18. Payments (Simulated)

**Actors:** ADMIN (manage fee concepts + assign fees), STUDENT (view own fees + pay)

Mock payment flow — no real payment gateway. Generates reference codes and records transactions.

### Fee Concepts (catalog)

| Operation | Endpoint | Roles |
|-----------|----------|-------|
| List | `GET /api/payments/fee-concepts` | ADMIN |
| Create | `POST /api/payments/fee-concepts` | ADMIN |
| Update | `PATCH /api/payments/fee-concepts/:id` | ADMIN |

### Student Fees

| Operation | Endpoint | Roles |
|-----------|----------|-------|
| List (student's own) | `GET /api/payments/student-fees` | Authenticated |
| Assign fee | `POST /api/payments/student-fees` | ADMIN |
| Assign bulk | `POST /api/payments/student-fees/bulk` | ADMIN |

### Payment Flow

**Endpoint:** `POST /api/payments/pay/:studentFeeId`

| Step | Description |
|------|-------------|
| 1 | Validate fee exists, status=PENDING, student owns it |
| 2 | Accept payment method (CARD, TRANSFER, CASH) |
| 3 | Generate reference code: `PAY-{uuid.slice(0,8).toUpperCase()}` |
| 4 | Transaction: create Payment record + update StudentFee.status=PAID |
| 5 | Create notification (PAYMENT_CONFIRMED) |
| 6 | Create audit log entry |

**Fee statuses:** PENDING, PAID, OVERDUE, CANCELLED.

---

## 19. Student Self-Enrollment

**Actors:** STUDENT (enroll self), ADMIN (enroll any student)

Extended from Process 10. Students can now enroll themselves into available groups for their career.

### New Endpoints

| Operation | Endpoint | Roles |
|-----------|----------|-------|
| Available groups | `GET /api/enrollments/available-groups` | STUDENT |
| Enroll (self) | `POST /api/enrollments/enroll` | ADMIN, STUDENT |

### Self-Enrollment Flow

| Step | Description |
|------|-------------|
| 1 | Student browses available groups (filtered by career, active period, excluding already-enrolled) |
| 2 | Student selects a group and submits enrollment |
| 3 | System verifies `req.user.sub === student.userId` (can only enroll themselves) |
| 4 | Stored procedure `sp_enroll_student` validates prerequisites, capacity, etc. (same as admin flow) |
| 5 | On success: creates enrollment + notification (ENROLLMENT_CONFIRMED) |

**Rules:** Same validation chain as admin enrollment (Process 10). Student ownership enforced at the controller level.

---

## 20. Announcements

**Actors:** ADMIN (full CRUD), TEACHER (CRUD own), all authenticated (read relevant)

Targeted communication system with audience-based delivery.

### Operations

| Operation | Endpoint | Roles |
|-----------|----------|-------|
| List all | `GET /api/announcements` | ADMIN, TEACHER |
| My announcements | `GET /api/announcements/my` | Authenticated |
| Get | `GET /api/announcements/:id` | Authenticated |
| Create | `POST /api/announcements` | ADMIN, TEACHER |
| Update | `PATCH /api/announcements/:id` | ADMIN, TEACHER |
| Delete | `DELETE /api/announcements/:id` | ADMIN |

**List pagination:** `GET /api/announcements` and `GET /api/announcements/my` accept optional query `page` (default `1`) and `pageSize` (default `20`, max `100`). Response shape: `{ data, total, page, pageSize }` (newest first by `publishedAt`).

**Frontend:** `/anuncios` uses that pagination (table footer). Admin flows for **inscripciones** (período + diálogo estudiante/grupo), **contenido**, **evaluaciones** y **calificaciones** use searchable autocomplete pickers for período/grupo so large catalogues stay usable without rendering huge dropdowns.

### Audience Types

| Audience | Target resolution |
|----------|------------------|
| `ALL` | All students |
| `CAREER` | Students in the specified career (`targetId` = careerId) |
| `GROUP` | Students enrolled in the specified group (`targetId` = groupId) |

### On Create

1. Resolve targeted user IDs based on audience type
2. Create announcement record
3. Fan-out notifications to all resolved users via `notificationsService.createBulk()`

---

## 21. Calendar Events

**Actors:** ADMIN (full CRUD), all authenticated (read)

Academic calendar management for holidays, exam weeks, deadlines, and other events.

### Operations

| Operation | Endpoint | Roles |
|-----------|----------|-------|
| List | `GET /api/calendar-events?periodId&upcoming` | Authenticated |
| Get | `GET /api/calendar-events/:id` | Authenticated |
| Create | `POST /api/calendar-events` | ADMIN |
| Update | `PATCH /api/calendar-events/:id` | ADMIN |
| Delete | `DELETE /api/calendar-events/:id` | ADMIN |

### Event Types

`HOLIDAY`, `EXAM_WEEK`, `DEADLINE`, `OTHER`

Events optionally link to an academic period. The `upcoming` filter returns events with `startDate >= today`.

---

## 22. Reports & Analytics

**Actors:** ADMIN (read-only)

Aggregation queries on existing data — no new tables required.

| Endpoint | Returns |
|----------|---------|
| `GET /api/reports/enrollment-stats` | Enrollment count per period, grouped by career |
| `GET /api/reports/pass-fail` | Pass/fail counts from academic records per period |
| `GET /api/reports/gpa-trends` | Average GPA per period from academic records |
| `GET /api/reports/at-risk` | At-risk student count + list |
| `GET /api/reports/summary` | Combined dashboard stats (students, teachers, periods, enrollments, at-risk, pending fees) |

**Frontend:** Admin reports page with 4 chart cards (recharts): enrollment bar chart, pass/fail pie chart, GPA trend line chart, at-risk student count.

---

## 23. Department Catalogue

**Actors:** All authenticated (read-only)

Read-only reference catalogue of academic departments used to populate the Departamento dropdown in the teacher create/edit form.

| Operation | Endpoint | Roles |
|-----------|----------|-------|
| List | `GET /api/departments` | All authenticated |

Departments are seeded on first run and ordered alphabetically. The 21 seeded departments cover the main academic areas of a Mexican university:

Administración de Empresas, Arquitectura, Biología, Ciencias Computacionales, Comunicación, Contabilidad, Derecho, Diseño Gráfico, Educación, Enfermería, Física, Humanidades, Idiomas, Ingeniería Civil, Ingeniería Eléctrica, Ingeniería Mecánica, Ingeniería en Sistemas, Matemáticas, Medicina, Psicología, Química.

**Rules:** No create/update/delete via API — managed through DB seed. The `department` field on the `teachers` table remains a `varchar(150)` string (not a foreign key) so historical records are preserved if a department name is ever renamed in the seed.

---

## 24. Signup Request Management

**Actors:** ADMIN

Admin-facing queue for reviewing and acting on pending student self-registrations (see Process 3a).

| Operation | Endpoint | Notes |
|-----------|----------|-------|
| List pending | `GET /api/estudiantes` (filtered client-side to `academicStatus=PENDING`) | Returns all students; PENDING ones shown in the queue |
| Approve | `PATCH /api/estudiantes/:id/approve` | Activates login + sets ACTIVE status atomically |
| Reject | `DELETE /api/estudiantes/:id` | Soft-deletes student record; associated User is not deleted |

**Frontend:** `/solicitudes-registro` page shows only PENDING students with a summary card (pending count), a DataTable (name, email, career, date), and per-row Approve / Reject actions. Reject opens a confirmation dialog. Empty state is shown when the queue is clear. Also accessible from the admin dashboard quick actions.

---

## 25. Draft Enrollment (Cart-Based Self-Enrollment)

**Actors:** STUDENT

Extended from Process 19. Students build a "cart" of desired groups before confirming enrollment.

### Frontend UX

The `/inscribir` page has a two-panel layout:
- **Left panel** — Available groups table with prerequisite status indicators (✓ or ⚠), capacity chip, and "Add to cart" button per row
- **Right panel** — Cart showing selected groups, total credits, prerequisite warnings, and a "Confirm" button

| Icon | Meaning |
|------|---------|
| ✓ green | All prerequisites passed |
| ⚠ yellow | One or more prerequisites not yet passed (hover to see which) |

### Prerequisite Information

`GET /api/enrollments/available-groups` now returns enriched data per group:
- `prerequisitesMet: boolean` — whether the student has passed all prerequisites
- `subject.prerequisites[]` — list of prerequisites, each with `{ id, name, code, met: boolean }`

Computed server-side by comparing the student's `AcademicRecord` (passed=true) against each subject's `subject_prerequisites`.

### Enrollment Flow

| Step | Description |
|------|-------------|
| 1 | Student adds groups to cart (no enrollment yet — pure UI state) |
| 2 | Student can remove groups from cart freely |
| 3 | Student clicks "Confirmar inscripción" |
| 4 | System calls `POST /api/enrollments/enroll` for each cart item sequentially |
| 5 | Each item is validated by `sp_enroll_student` (prerequisites, capacity, etc.) |
| 6 | Items that fail show individual error messages; successful items are confirmed |
| 7 | Available groups list refreshes to exclude newly enrolled subjects |

**Rules:** Students can add subjects with unmet prerequisites to the cart but receive a warning. Final validation is server-side. Students can freely modify the cart before confirming.

---

## 26. Subject Drop (Baja de Materia)

**Actors:** STUDENT (own active-period subjects), ADMIN

Students can drop individual subjects while the enrollment is still ACTIVE (i.e., before period is closed).

### Frontend UX

`/mi-inscripcion` page shows all enrollment history. Subjects with `status = ENROLLED` and belonging to an ACTIVE enrollment show a "Dar de baja" button. Clicking it opens a confirmation dialog.

### Drop Flow

| Step | Description |
|------|-------------|
| 1 | Student clicks "Dar de baja" on an ENROLLED subject |
| 2 | Confirmation dialog shown with subject name |
| 3 | On confirm: `PATCH /api/enrollments/drop` with `{ enrollmentSubjectId }` |
| 4 | Stored procedure `sp_drop_enrollment_subject` sets status = DROPPED, decrements `group.currentStudents` |
| 5 | Page refreshes; dropped subject shows "Baja" chip |

**Rules:** Only ENROLLED subjects in an ACTIVE enrollment can be dropped. COMPLETED, FAILED, and DROPPED subjects do not show the button.

---

## 27. End Academic Period Workflow

**Actors:** ADMIN

### Period Lifecycle

Academic periods follow a three-phase state machine:

```
OPEN  →  GRADING  →  CLOSED
```

| Status | enrollmentOpen | Description |
|--------|---------------|-------------|
| OPEN | true or false | Ciclo en curso; las inscripciones pueden estar abiertas o cerradas según la ventana institucional |
| GRADING | **always false** | Fase final del ciclo: inscripciones **cerradas** obligatoriamente; docentes cargan calificaciones finales |
| CLOSED | false | Período cerrado; histórico inmutable |

**Invariante:** `status = GRADING` y `enrollmentOpen = true` **nunca** pueden darse a la vez. El backend lo valida en `PATCH` y rechaza `toggle-enrollment` en fase `GRADING`.

### Phase 1 — Iniciar Calificación (OPEN → GRADING)

**Endpoint:** `PATCH /api/academic-periods/:id/start-grading` (ADMIN)

| Step | Description |
|------|-------------|
| 1 | Admin clicks "Iniciar Calificación" button on a period row |
| 2 | Sets `enrollmentOpen = false` (siempre), `status = GRADING` — cierra inscripciones aunque estuvieran abiertas |
| 3 | Writes AuditLog entry (STATUS_CHANGE) |
| 4 | Teachers see their groups but can no longer accept new students |

### Phase 2 — Monitoring

**Endpoint:** `GET /api/academic-periods/:id/progress` (ADMIN)

Returns per-group grading completion:
- `totalGroups` / `completedGroups` / `overallPct`
- Per group: total grade slots (enrolled students × evaluations) vs graded slots

Admin can open the **Progress Drawer** from the period row (AssessmentIcon button) to view live grading progress.

A group is "complete" when all enrolled students have grades for all evaluations. Groups with no evaluations or no enrolled students are automatically considered complete.

### Phase 3 — Cerrar Período (GRADING → CLOSED)

**Endpoint:** `POST /api/academic-periods/:id/close` (ADMIN)
Body: `{ force: boolean }`

| Step | Description |
|------|-------------|
| 1 | Admin opens Progress Drawer, clicks "Cerrar Período" |
| 2 | Confirmation dialog shows incomplete groups (if any) |
| 3 | If incomplete groups exist: admin must check "Forzar cierre" checkbox to proceed |
| 4 | On confirm: backend runs the close transaction (see below) |

**Close transaction (atomic):**
1. Lock period row for update
2. If `force=true`: generate `AcademicRecord(finalGrade=0, passed=false)` for any student-group pair missing a record
3. Update all ENROLLED `EnrollmentSubject` → COMPLETED (if passed) or FAILED
4. Update all ACTIVE `Enrollment` → CLOSED
5. Deactivate all `Group` rows in the period (`isActive=false`)
6. Update `AcademicPeriod`: `status=CLOSED`, `isActive=false`, `enrollmentOpen=false`
7. Write AuditLog entry
8. Send GENERAL notification to all students: "Tu período académico ha sido cerrado. Tus calificaciones finales ya están disponibles."

**Rules:**
- A period must be in GRADING status to be closed
- While `status = GRADING`, `enrollmentOpen` must remain `false`; opening enrollments or toggling them in that phase is rejected by the API
- Closed periods are immutable (update and toggle-enrollment endpoints reject changes)
- `force=true` is required if any groups have incomplete grading
- The existing DB trigger `fn_generate_academic_record` continues to handle individual grade-level record generation during GRADING phase; the close transaction only fills gaps for force-closed groups

---

## Not Implemented

The following academic processes are **not** currently handled:
- **Attendance tracking** — no attendance records
- **Faculty workload / contracts** — no HR-related processes
- **Library / resources** — no resource management
- **Transfer credits** — no mechanism for external credit recognition
