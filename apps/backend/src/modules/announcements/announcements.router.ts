import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { announcementsController } from "./announcements.controller";

export const announcementsRouter = Router();

announcementsRouter.get("/my", authenticate, announcementsController.findMy);
announcementsRouter.get(
  "/",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  announcementsController.findAll,
);
announcementsRouter.get("/:id", authenticate, announcementsController.findById);
announcementsRouter.post(
  "/",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  announcementsController.create,
);
announcementsRouter.patch(
  "/:id",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  announcementsController.update,
);
announcementsRouter.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  announcementsController.delete,
);
