import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { subjectsController } from "./subjects.controller";

export const subjectsRouter = Router();

subjectsRouter.get("/", authenticate, subjectsController.findAll);
subjectsRouter.get("/:id", authenticate, subjectsController.findById);
subjectsRouter.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  subjectsController.create,
);
subjectsRouter.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  subjectsController.update,
);
subjectsRouter.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  subjectsController.softDelete,
);
subjectsRouter.post(
  "/:id/prerequisites",
  authenticate,
  authorize("ADMIN"),
  subjectsController.addPrerequisite,
);
subjectsRouter.delete(
  "/:id/prerequisites/:prereqId",
  authenticate,
  authorize("ADMIN"),
  subjectsController.removePrerequisite,
);
