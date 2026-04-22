import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { paymentsController } from "./payments.controller";

export const paymentsRouter = Router();

// Fee concepts
paymentsRouter.get(
  "/fee-concepts",
  authenticate,
  authorize("ADMIN"),
  paymentsController.findAllFeeConcepts,
);
paymentsRouter.post(
  "/fee-concepts",
  authenticate,
  authorize("ADMIN"),
  paymentsController.createFeeConcept,
);
paymentsRouter.patch(
  "/fee-concepts/:id",
  authenticate,
  authorize("ADMIN"),
  paymentsController.updateFeeConcept,
);

// Student fees
paymentsRouter.get(
  "/student-fees",
  authenticate,
  paymentsController.findStudentFees,
);
paymentsRouter.post(
  "/student-fees",
  authenticate,
  authorize("ADMIN"),
  paymentsController.assignFee,
);
paymentsRouter.post(
  "/student-fees/bulk",
  authenticate,
  authorize("ADMIN"),
  paymentsController.bulkAssignFees,
);

// Payment
paymentsRouter.post(
  "/pay/:studentFeeId",
  authenticate,
  authorize("STUDENT"),
  paymentsController.pay,
);
paymentsRouter.get(
  "/history",
  authenticate,
  paymentsController.findPaymentHistory,
);
