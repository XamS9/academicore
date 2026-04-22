import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { contentItemsService } from "./content-items.service";
import { ContentItemsController } from "./content-items.controller";

export const contentItemsRouter = Router();
const controller = new ContentItemsController(contentItemsService);

contentItemsRouter.get("/topic/:topicId", authenticate, controller.findByTopic);
contentItemsRouter.get("/:id", authenticate, controller.findById);
contentItemsRouter.post(
  "/",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  controller.create,
);
contentItemsRouter.patch(
  "/:id",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  controller.update,
);
contentItemsRouter.delete(
  "/:id",
  authenticate,
  authorize("ADMIN", "TEACHER"),
  controller.delete,
);
