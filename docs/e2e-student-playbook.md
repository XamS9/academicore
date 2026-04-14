# Student E2E Cycle Test Guide

This guide validates all major `STUDENT` capabilities from zero progress to end-of-cycle.

## Test Credentials

- Student: `student.e2e@academicore.com` / `StudentE2E#2026`
- Admin collaborator: `admin.e2e@academicore.com` / `AdminE2E#2026`
- Teacher collaborator: `teacher.e2e@academicore.com` / `TeacherE2E#2026`

## Initial State (after seed)

- Student exists with role `STUDENT`.
- Student profile exists (`EST-E2E-001`) with `ACTIVE` status.
- No enrollments, no grades, no certifications (clean baseline).

## Full Student Step-by-Step

1. Login as `student.e2e`.
2. Open profile/home and verify role-limited navigation.
3. Open notifications and confirm initial unread state.
4. Open `/inscribir` and load available groups.
5. Review prerequisite indicators in available groups list.
6. Add eligible groups to cart and confirm enrollment.
7. If a group with unmet prerequisites is attempted, verify warning/error handling.
8. Open `/mi-inscripcion` and validate new subjects appear as `ENROLLED`.
9. If drop window is active, drop one subject and validate status becomes `DROPPED`.
10. Return to `/mi-inscripcion` and confirm history/status chips are correct.
11. Open teacher-published group content and validate topic/material visibility.
12. Open evaluations view and verify created evaluations are visible.
13. Submit required work (if submission flow is enabled for the evaluation).
14. Wait for teacher grading and check grades in current group view.
15. Check historical grades endpoint/view after status transitions.
16. Open announcements and verify `ALL`, `CAREER`, and `GROUP` targeted messages.
17. Open payments, review assigned fee, and pay using one method.
18. Confirm payment status changes and payment notification appears.
19. After admin moves period to `GRADING`, attempt new enrollment and verify rejection.
20. After period close, verify final enrollment subject statuses (`COMPLETED`/`FAILED`/`DROPPED`) are consistent.
21. If criteria are met and admin issues a certificate, open certification view and verify certificate details.
22. Validate public verification using provided certificate code.

## Expected Results Checklist

- Student can complete self-service cycle operations with correct permission boundaries.
- Enrollment, drop, grades, notifications, announcements, and payments are coherent.
- End-of-period transitions are reflected in student history and final statuses.
