import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { careersController } from "./careers.controller";

export const careersRouter = Router();

careersRouter.get("/", careersController.findAll);
careersRouter.get(
  "/suggest-code",
  authenticate,
  authorize("ADMIN"),
  careersController.suggestCode,
);
careersRouter.get("/:id", careersController.findById);
careersRouter.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  careersController.create,
);
careersRouter.patch(
  "/:id/toggle-active",
  authenticate,
  authorize("ADMIN"),
  careersController.toggleActive,
);
careersRouter.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  careersController.update,
);
careersRouter.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  careersController.softDelete,
);
careersRouter.post(
  "/:id/subjects",
  authenticate,
  authorize("ADMIN"),
  careersController.addSubject,
);
careersRouter.patch(
  "/:id/subjects/:subjectId",
  authenticate,
  authorize("ADMIN"),
  careersController.updateCareerSubject,
);
careersRouter.delete(
  "/:id/subjects/:subjectId",
  authenticate,
  authorize("ADMIN"),
  careersController.removeSubject,
);
