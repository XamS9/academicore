import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { AcademicRecordsController } from "./academic-records.controller";
import { AcademicRecordsService } from "./academic-records.service";

const controller = new AcademicRecordsController(new AcademicRecordsService());

export const academicRecordsRouter = Router();

academicRecordsRouter.get(
  "/me",
  authenticate,
  authorize("STUDENT"),
  controller.findMine,
);
academicRecordsRouter.get(
  "/me/period/:periodId",
  authenticate,
  authorize("STUDENT"),
  controller.findMineAndPeriod,
);
academicRecordsRouter.get(
  "/me/averages",
  authenticate,
  authorize("STUDENT"),
  controller.getMyAverageByPeriod,
);
academicRecordsRouter.get(
  "/me/passed",
  authenticate,
  authorize("STUDENT"),
  controller.getMyPassedSubjects,
);
academicRecordsRouter.get(
  "/me/failed",
  authenticate,
  authorize("STUDENT"),
  controller.getMyFailedSubjects,
);
academicRecordsRouter.get(
  "/student/:studentId",
  authenticate,
  controller.findByStudent,
);
academicRecordsRouter.get(
  "/student/:studentId/period/:periodId",
  authenticate,
  controller.findByStudentAndPeriod,
);
academicRecordsRouter.get(
  "/student/:studentId/averages",
  authenticate,
  controller.getStudentAverageByPeriod,
);
academicRecordsRouter.get(
  "/student/:studentId/passed",
  authenticate,
  controller.getPassedSubjects,
);
academicRecordsRouter.get(
  "/student/:studentId/failed",
  authenticate,
  controller.getFailedSubjects,
);
