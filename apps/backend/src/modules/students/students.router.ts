import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { studentsController } from "./students.controller";

export const studentsRouter = Router();

studentsRouter.get(
  "/",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  studentsController.findAll,
);
studentsRouter.get(
  "/by-user/:userId",
  authenticate,
  studentsController.findByUserId,
);
studentsRouter.get("/:id", authenticate, studentsController.findById);
studentsRouter.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  studentsController.create,
);
studentsRouter.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  studentsController.update,
);
studentsRouter.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  studentsController.softDelete,
);
