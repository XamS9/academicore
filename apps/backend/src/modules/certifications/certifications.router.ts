import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { certificationsController } from "./certifications.controller";

export const certificationsRouter = Router();

// Public — no auth
certificationsRouter.get(
  "/verify/:code",
  certificationsController.validateByCode,
);

// Protected
certificationsRouter.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  certificationsController.findAll,
);
certificationsRouter.get(
  "/me",
  authenticate,
  authorize("STUDENT"),
  certificationsController.findMine,
);
certificationsRouter.get(
  "/student/:studentId",
  authenticate,
  certificationsController.findByStudent,
);
certificationsRouter.post(
  "/issue",
  authenticate,
  authorize("ADMIN"),
  certificationsController.issue,
);
certificationsRouter.post(
  "/:id/revoke",
  authenticate,
  authorize("ADMIN"),
  certificationsController.revoke,
);
certificationsRouter.get(
  "/criteria",
  authenticate,
  certificationsController.findCriteria,
);
certificationsRouter.post(
  "/criteria",
  authenticate,
  authorize("ADMIN"),
  certificationsController.createCriteria,
);
certificationsRouter.get(
  "/:id/pdf",
  authenticate,
  certificationsController.downloadPdf,
);
