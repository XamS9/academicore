import { Request, Response, NextFunction } from "express";
import { departmentsService } from "./departments.service";

class DepartmentsController {
  findAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await departmentsService.findAll();
      res.json(data);
    } catch (err) {
      next(err);
    }
  };
}

export const departmentsController = new DepartmentsController();
