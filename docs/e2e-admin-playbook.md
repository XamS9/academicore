# Admin E2E Cycle Test Guide

This guide is for validating all major `ADMIN` capabilities while collaborating with the dedicated teacher and student test users.

## Test Credentials

- Admin: `admin.e2e@academicore.com` / `AdminE2E#2026`
- Teacher collaborator: `teacher.e2e@academicore.com` / `TeacherE2E#2026`
- Student collaborator: `student.e2e@academicore.com` / `StudentE2E#2026`

## Preconditions

1. Seed data is loaded (`npm run prisma:seed` from `apps/backend`).
2. Backend and frontend are running.
3. Login as admin and verify dashboard access.

## Full Admin Step-by-Step

1. Open `/usuarios` and confirm the three E2E users exist and are active.
2. Open `/carreras` and verify there is at least one active career (`ISC`).
3. Open `/materias` and confirm subjects exist and are active.
4. Open `/periodos` and identify one active `OPEN` period (or create one if needed).
5. In `/periodos`, ensure enrollment is open for that period (`toggle-enrollment`).
6. Open `/grupos` y confirma el grupo sembrado **ETH101-E2E** (2026-1, docente `teacher.e2e`) o crea otro si lo necesitas.
7. In group scheduling, assign classroom/time and validate no conflict errors for valid slot.
8. Open `/anuncios` and create an `ALL` announcement.
9. Create a `CAREER` announcement targeting the E2E student career.
10. Create a `GROUP` announcement targeting the new E2E group.
11. Open payments section and assign one inscription fee to `student.e2e` for the active period.
12. Open `/calendar-events` and create one event of each type (`HOLIDAY`, `EXAM_WEEK`, `DEADLINE`, `OTHER`).
13. Ask student to confirm content/evaluation access is blocked until fee payment.
14. Ask student to pay the fee and confirm access is unlocked afterward.
15. Open reports and verify data loads for enrollment/pass-fail/GPA/at-risk.
16. Return to `/periodos` and execute `Iniciar Calificación` for the selected period.
17. Validate enrollment is now closed automatically.
18. Open progress drawer and verify group grading progress appears.
19. Try closing the period without full grades; verify expected warning/force behavior.
20. Close period using the intended path (normal or force).
21. Validate period changed to `CLOSED`, groups deactivated, enrollment closed.
22. Open audit view and validate entries for status transitions and major operations.
23. If student satisfies criteria, issue one certification and verify it appears in list.
24. Verify public certification endpoint works with generated verification code.

## Expected Results Checklist

- Admin can manage all core catalogs and lifecycle workflows.
- `OPEN -> GRADING -> CLOSED` flow is enforced correctly.
- Enrollment cannot stay open in `GRADING`.
- Student learning content remains blocked until inscription fee is paid.
- Cross-role side effects are visible (notifications, grading progress, history).
- Audit traces exist for major state-changing actions.
