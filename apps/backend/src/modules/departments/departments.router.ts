import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { departmentsController } from "./departments.controller";

export const departmentsRouter = Router();

departmentsRouter.get("/", authenticate, departmentsController.findAll);
departmentsRouter.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  departmentsController.create,
);
departmentsRouter.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  departmentsController.update,
);
departmentsRouter.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  departmentsController.destroy,
);
