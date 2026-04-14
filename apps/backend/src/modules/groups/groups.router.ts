import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { groupsController } from "./groups.controller";

export const groupsRouter = Router();

groupsRouter.get("/", authenticate, groupsController.findAll);
groupsRouter.get(
  "/teacher/:teacherId",
  authenticate,
  groupsController.findByTeacher,
);
groupsRouter.get("/:id", authenticate, groupsController.findById);
groupsRouter.get("/:id/students", authenticate, groupsController.findStudentsByGroup);
groupsRouter.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  groupsController.create,
);
groupsRouter.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  groupsController.update,
);
groupsRouter.post(
  "/:id/classrooms",
  authenticate,
  authorize("ADMIN"),
  groupsController.assignClassroom,
);
