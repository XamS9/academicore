import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { calendarEventsController } from "./calendar-events.controller";

export const calendarEventsRouter = Router();

calendarEventsRouter.get("/", authenticate, calendarEventsController.findAll);
calendarEventsRouter.get(
  "/:id",
  authenticate,
  calendarEventsController.findById,
);
calendarEventsRouter.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  calendarEventsController.create,
);
calendarEventsRouter.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  calendarEventsController.update,
);
calendarEventsRouter.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  calendarEventsController.delete,
);
