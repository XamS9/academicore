import { Request, Response, NextFunction } from "express";
import { teachersService } from "./teachers.service";
import { CreateTeacherDto, UpdateTeacherDto } from "./teachers.dto";

class TeachersController {
  findAll = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const teachers = await teachersService.findAll();
      res.status(200).json(teachers);
    } catch (err) {
      next(err);
    }
  };

  findById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const teacher = await teachersService.findById(req.params.id);
      res.status(200).json(teacher);
    } catch (err) {
      next(err);
    }
  };

  findByUserId = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const teacher = await teachersService.findByUserId(req.params.userId);
      res.status(200).json(teacher);
    } catch (err) {
      next(err);
    }
  };

  create = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const dto = CreateTeacherDto.parse(req.body);
      const teacher = await teachersService.create(dto);
      res.status(201).json(teacher);
    } catch (err) {
      next(err);
    }
  };

  update = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const dto = UpdateTeacherDto.parse(req.body);
      const teacher = await teachersService.update(req.params.id, dto);
      res.status(200).json(teacher);
    } catch (err) {
      next(err);
    }
  };

  softDelete = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await teachersService.softDelete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}

export const teachersController = new TeachersController();
