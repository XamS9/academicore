# Student E2E Cycle Test Guide

This guide validates all major `STUDENT` capabilities from zero progress to end-of-cycle.

## Test Credentials

- Student: `student.e2e@academicore.com` / `student123`
- Admin collaborator: `admin.e2e@academicore.com` / `admin123`
- Teacher collaborator: `teacher.e2e@academicore.com` / `teacher123`

## Initial State (after seed)

- Student exists with role `STUDENT`.
- Student profile exists (`EST-E2E-001`) with `ACTIVE` status.
- No enrollments, no grades, no certifications (clean baseline).
- Sin cargo de **inscripción semestral** hasta que el estudiante se inscriba al menos a un grupo en **2026-1** (entonces se crea el cargo **PENDIENTE**, igual que en producción).
- For período **2026-1**, todos los grupos ISC con oferta (p. ej. `BD101-A`, `PRG201-A` / `PRG201-B`, `RED101-A` / `RED101-V` / `RED101-H`, **`ETH101-E2E`** docente `teacher.e2e`) incluyen **temas y materiales de demostración** en la semilla. Si tu base ya existía, vuelve a ejecutar `npm run prisma:seed` en `apps/backend` para aplicar estos datos.

## Full Student Step-by-Step

1. Login as `student.e2e`.
2. Open profile/home and verify role-limited navigation.
3. Open notifications and confirm initial unread state.
4. Open `/inscribir` and load available groups.
5. Review prerequisite indicators in available groups list.
6. Add eligible groups to cart and confirm enrollment.
7. If a group with unmet prerequisites is attempted, verify warning/error handling.
8. Open `/mi-inscripcion` and validate new subjects appear as `ENROLLED`.
9. Confirm a **PENDIENTE** cargo de inscripción semestral apareció para 2026-1 (generado al inscribir el primer grupo).
10. If drop window is active, drop one subject and validate status becomes `DROPPED`.
11. Return to `/mi-inscripcion` and confirm history/status chips are correct.
12. Try opening teacher-published group content before paying and verify access is denied.
13. Open payments, review assigned inscription fee, and pay using one method.
14. Confirm payment status changes and payment notification appears.
15. Open teacher-published group content and validate topic/material visibility (now allowed).
16. Open evaluations view and verify created evaluations are visible (now allowed).
17. Submit required work (if submission flow is enabled for the evaluation).
18. Wait for teacher grading and check grades in current group view.
19. Check historical grades endpoint/view after status transitions.
20. Open announcements and verify `ALL`, `CAREER`, and `GROUP` targeted messages.
21. After admin moves period to `GRADING`, attempt new enrollment and verify rejection.
22. After period close, verify final enrollment subject statuses (`COMPLETED`/`FAILED`/`DROPPED`) are consistent.
23. If criteria are met and admin issues a certificate, open certification view and verify certificate details.
24. Validate public verification using provided certificate code.

## Expected Results Checklist

- Student can complete self-service cycle operations with correct permission boundaries.
- Enrollment, payment, content access, drop, grades, notifications, and announcements are coherent.
- Student content/evaluation/submission access is blocked until inscription fee is paid.
- End-of-period transitions are reflected in student history and final statuses.
