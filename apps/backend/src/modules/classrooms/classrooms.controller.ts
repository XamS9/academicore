import { Request, Response, NextFunction } from "express";
import { classroomsService } from "./classrooms.service";
import { CreateClassroomDto, UpdateClassroomDto } from "./classrooms.dto";

class ClassroomsController {
  findAll = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const classrooms = await classroomsService.findAll();
      res.status(200).json(classrooms);
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
      const classroom = await classroomsService.findById(req.params.id);
      res.status(200).json(classroom);
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
      const dto = CreateClassroomDto.parse(req.body);
      const classroom = await classroomsService.create(dto);
      res.status(201).json(classroom);
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
      const dto = UpdateClassroomDto.parse(req.body);
      const classroom = await classroomsService.update(req.params.id, dto);
      res.status(200).json(classroom);
    } catch (err) {
      next(err);
    }
  };

  toggleActive = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const classroom = await classroomsService.toggleActive(req.params.id);
      res.status(200).json(classroom);
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
      await classroomsService.softDelete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}

export const classroomsController = new ClassroomsController();
