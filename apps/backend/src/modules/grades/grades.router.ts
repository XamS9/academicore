import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { gradesService } from "./grades.service";
import { GradesController } from "./grades.controller";

export const gradesRouter = Router();
const controller = new GradesController(gradesService);

gradesRouter.get(
  "/evaluation/:evaluationId",
  authenticate,
  controller.findByEvaluation,
);
gradesRouter.get(
  "/student/:studentId/group/:groupId",
  authenticate,
  controller.findByStudentAndGroup,
);
gradesRouter.post(
  "/bulk",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  controller.bulkUpsert,
);
gradesRouter.post(
  "/",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  controller.upsert,
);
