# Teacher E2E Cycle Test Guide

This guide validates all major `TEACHER` capabilities for a complete cycle using the seeded E2E users.

## Test Credentials

- Teacher: `teacher.e2e@academicore.com` / `TeacherE2E#2026`
- Admin collaborator: `admin.e2e@academicore.com` / `AdminE2E#2026`
- Student collaborator: `student.e2e@academicore.com` / `StudentE2E#2026`

## Preconditions

1. Admin created/assigned at least one active-period group to `teacher.e2e`.
2. Student is enrolled in that group.
3. Teacher can see the group in `Mis Grupos`.

## Full Teacher Step-by-Step

1. Login and open `Mis Grupos`.
2. Open the assigned group detail page.
3. In `Contenido`, create at least 2 topics with different week numbers.
4. Inside each topic, create one `TEXT`, one `LINK`, and one `FILE_REF` content item.
5. Edit one topic and one content item, then delete one content item.
6. Reorder topics and verify new order persists.
7. In `Evaluaciones`, create at least 3 evaluations with total weight <= 100.
8. Try to exceed allowed total weight and verify validation error appears.
9. Edit one evaluation and verify weight/rules are revalidated.
10. Open submissions viewer for an evaluation and review student entries (if submitted).
11. In `Calificaciones`, enter grades for enrolled student(s).
12. Use bulk save path and verify persistence.
13. Confirm graded data is reflected in evaluation and grade tabs.
14. During `OPEN`, verify normal grading and content operations work.
15. After admin moves period to `GRADING`, verify no new enrollments occur but grading remains available.
16. Complete missing grades to drive group progress toward 100%.
17. Validate student can view posted grades afterward.

## Expected Results Checklist

- Teacher can manage content, evaluations, and grades for own groups.
- Weight validation prevents invalid evaluation distributions.
- Grade publication updates student visibility and academic progression.
- Teacher permissions stay scoped to assigned groups.
