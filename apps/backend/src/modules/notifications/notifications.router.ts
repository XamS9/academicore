import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { notificationsController } from "./notifications.controller";

export const notificationsRouter = Router();

notificationsRouter.get("/", authenticate, notificationsController.findMine);
notificationsRouter.get(
  "/unread-count",
  authenticate,
  notificationsController.unreadCount,
);
notificationsRouter.patch(
  "/:id/read",
  authenticate,
  notificationsController.markRead,
);
notificationsRouter.patch(
  "/read-all",
  authenticate,
  notificationsController.markAllRead,
);
