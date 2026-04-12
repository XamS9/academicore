import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { studentSubmissionsService } from "./student-submissions.service";
import { StudentSubmissionsController } from "./student-submissions.controller";

export const studentSubmissionsRouter = Router();
const controller = new StudentSubmissionsController(studentSubmissionsService);

// Teacher/Admin: list all submissions for an evaluation
studentSubmissionsRouter.get(
  "/evaluation/:evaluationId",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  controller.findByEvaluation,
);

// Student/Admin: list submissions for a specific student
studentSubmissionsRouter.get(
  "/student/:studentId",
  authenticate,
  controller.findByStudent,
);

// Student: submit content for an evaluation
studentSubmissionsRouter.post(
  "/",
  authenticate,
  authorize("STUDENT"),
  controller.create,
);

// Student: update their submission
studentSubmissionsRouter.patch(
  "/:id",
  authenticate,
  authorize("STUDENT"),
  controller.update,
);

// Student: delete their submission
studentSubmissionsRouter.delete(
  "/:id",
  authenticate,
  authorize("STUDENT"),
  controller.delete,
);
