import { Request, Response, NextFunction } from "express";
import { departmentsService } from "./departments.service";
import { CreateDepartmentDto, UpdateDepartmentDto } from "./departments.dto";

class DepartmentsController {
  findAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await departmentsService.findAll();
      res.json(data);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = CreateDepartmentDto.parse(req.body);
      const data = await departmentsService.create(dto);
      res.status(201).json(data);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = UpdateDepartmentDto.parse(req.body);
      const data = await departmentsService.update(req.params.id, dto);
      res.json(data);
    } catch (err) {
      next(err);
    }
  };

  destroy = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await departmentsService.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}

export const departmentsController = new DepartmentsController();
