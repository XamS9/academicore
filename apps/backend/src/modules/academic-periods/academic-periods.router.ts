import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { academicPeriodsController } from "./academic-periods.controller";

export const academicPeriodsRouter = Router();

academicPeriodsRouter.get("/", authenticate, academicPeriodsController.findAll);
academicPeriodsRouter.get(
  "/active",
  authenticate,
  academicPeriodsController.findActive,
);
academicPeriodsRouter.get(
  "/:id",
  authenticate,
  academicPeriodsController.findById,
);
academicPeriodsRouter.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  academicPeriodsController.create,
);
academicPeriodsRouter.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  academicPeriodsController.update,
);
academicPeriodsRouter.patch(
  "/:id/toggle-enrollment",
  authenticate,
  authorize("ADMIN"),
  academicPeriodsController.toggleEnrollment,
);
