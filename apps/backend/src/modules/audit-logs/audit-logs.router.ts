import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { auditLogsController } from "./audit-logs.controller";

export const auditLogsRouter = Router();

auditLogsRouter.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  auditLogsController.findAll,
);
auditLogsRouter.get(
  "/entity/:entityType/:entityId",
  authenticate,
  authorize("ADMIN"),
  auditLogsController.findByEntity,
);
