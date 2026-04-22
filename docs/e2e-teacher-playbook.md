# Teacher E2E Cycle Test Guide

This guide validates all major `TEACHER` capabilities for a complete cycle using the seeded E2E users.

## Test Credentials

- Teacher: `teacher.e2e@academicore.com` / `teacher123`
- Admin collaborator: `admin.e2e@academicore.com` / `admin123`
- Student collaborator: `student.e2e@academicore.com` / `student123`

## Preconditions

1. Tras `npm run prisma:seed`, `teacher.e2e` tiene el grupo **2026-1 · ETH101-E2E** (ética) con temas, materiales y evaluaciones demo; aparece en `Mis Grupos`.
2. Para flujo alumno: el estudiante E2E se inscribe en un grupo ISC (p. ej. el mismo u otro) y paga la inscripción del período antes de ver contenido.
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
14. Verify with student that, before payment, course content/evaluations are blocked to them.
15. After student payment, verify they can access content/evaluations and submit work.
16. During `OPEN`, verify normal grading and content operations work.
17. After admin moves period to `GRADING`, verify no new enrollments occur but grading remains available.
18. Complete missing grades to drive group progress toward 100%.
19. Validate student can view posted grades afterward.

## Expected Results Checklist

- Teacher can manage content, evaluations, and grades for own groups.
- Teacher-side visibility is unaffected, while student visibility is payment-gated.
- Weight validation prevents invalid evaluation distributions.
- Grade publication updates student visibility and academic progression.
- Teacher permissions stay scoped to assigned groups.
