import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { reportsController } from "./reports.controller";

export const reportsRouter = Router();

reportsRouter.get(
  "/enrollment-stats",
  authenticate,
  authorize("ADMIN"),
  reportsController.enrollmentStats,
);
reportsRouter.get(
  "/pass-fail",
  authenticate,
  authorize("ADMIN"),
  reportsController.passFail,
);
reportsRouter.get(
  "/gpa-trends",
  authenticate,
  authorize("ADMIN"),
  reportsController.gpaTrends,
);
reportsRouter.get(
  "/at-risk",
  authenticate,
  authorize("ADMIN"),
  reportsController.atRisk,
);
reportsRouter.get(
  "/summary",
  authenticate,
  authorize("ADMIN"),
  reportsController.summary,
);
