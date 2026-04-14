import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { departmentsController } from "./departments.controller";

export const departmentsRouter = Router();

departmentsRouter.get("/", authenticate, departmentsController.findAll);
