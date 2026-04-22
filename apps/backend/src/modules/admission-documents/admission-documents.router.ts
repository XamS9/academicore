import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { authenticateAdmissionUpload } from "../../middleware/upload-token.middleware";
import { admissionDocumentsController } from "./admission-documents.controller";

export const admissionDocumentsRouter = Router();

// Public: required doc type list
admissionDocumentsRouter.get(
  "/required-types",
  admissionDocumentsController.getRequiredTypes,
);

// Public: standardized rejection reasons (active only; admin UI + student follow-up)
admissionDocumentsRouter.get(
  "/rejection-reasons",
  admissionDocumentsController.listRejectionReasons,
);

// Admin: full catalog of rejection reasons (create / update in Configuración)
admissionDocumentsRouter.get(
  "/rejection-reasons/management",
  authenticate,
  authorize("ADMIN"),
  admissionDocumentsController.listRejectionReasonsAll,
);
admissionDocumentsRouter.post(
  "/rejection-reasons/management",
  authenticate,
  authorize("ADMIN"),
  admissionDocumentsController.createRejectionReason,
);
admissionDocumentsRouter.patch(
  "/rejection-reasons/management/:id",
  authenticate,
  authorize("ADMIN"),
  admissionDocumentsController.updateRejectionReason,
);

// Upload: accepts either upload-token (registration flow) or regular JWT
admissionDocumentsRouter.post(
  "/",
  authenticateAdmissionUpload,
  admissionDocumentsController.create,
);

// Student: list own docs
admissionDocumentsRouter.get(
  "/me",
  authenticate,
  admissionDocumentsController.listMine,
);

// Admin: list docs for a specific student
admissionDocumentsRouter.get(
  "/student/:studentId",
  authenticate,
  authorize("ADMIN"),
  admissionDocumentsController.listByStudent,
);

// Admin: approve / reject
admissionDocumentsRouter.post(
  "/:id/approve",
  authenticate,
  authorize("ADMIN"),
  admissionDocumentsController.approve,
);
admissionDocumentsRouter.post(
  "/:id/reject",
  authenticate,
  authorize("ADMIN"),
  admissionDocumentsController.reject,
);
