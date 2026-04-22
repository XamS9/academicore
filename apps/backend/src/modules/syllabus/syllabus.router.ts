import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { syllabusController } from "./syllabus.controller";

export const syllabusRouter = Router();

// Subject-level topic CRUD (admin)
syllabusRouter.get(
  "/subjects/:subjectId/topics",
  authenticate,
  syllabusController.listBySubject,
);
syllabusRouter.post(
  "/subjects/:subjectId/topics",
  authenticate,
  authorize("ADMIN"),
  syllabusController.create,
);
syllabusRouter.put(
  "/subjects/:subjectId/topics/reorder",
  authenticate,
  authorize("ADMIN"),
  syllabusController.reorder,
);
syllabusRouter.put(
  "/topics/:id",
  authenticate,
  authorize("ADMIN"),
  syllabusController.update,
);
syllabusRouter.delete(
  "/topics/:id",
  authenticate,
  authorize("ADMIN"),
  syllabusController.remove,
);

// Group progress (teacher + student read)
syllabusRouter.get(
  "/groups/:groupId/progress",
  authenticate,
  syllabusController.getGroupProgress,
);
syllabusRouter.post(
  "/groups/:groupId/progress",
  authenticate,
  authorize("TEACHER"),
  syllabusController.markProgress,
);
syllabusRouter.delete(
  "/groups/:groupId/progress/:topicId",
  authenticate,
  authorize("TEACHER"),
  syllabusController.removeProgress,
);
