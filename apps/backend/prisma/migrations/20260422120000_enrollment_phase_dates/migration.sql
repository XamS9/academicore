-- Optional calendar window for self-service enrollment (in addition to enrollment_open flag).
-- When enrollment_phase_end_date is before "today" (UTC calendar day), enrollment_open is auto-cleared by the API.

ALTER TABLE "academic_periods"
ADD COLUMN "enrollment_phase_start_date" DATE,
ADD COLUMN "enrollment_phase_end_date" DATE;
