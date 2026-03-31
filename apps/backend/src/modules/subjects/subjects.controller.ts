import { Request, Response, NextFunction } from "express";
import { subjectsService } from "./subjects.service";
import {
  CreateSubjectDto,
  UpdateSubjectDto,
  AddPrerequisiteDto,
} from "./subjects.dto";

class SubjectsController {
  findAll = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const subjects = await subjectsService.findAll();
      res.status(200).json(subjects);
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
      const subject = await subjectsService.findById(req.params.id);
      res.status(200).json(subject);
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
      const dto = CreateSubjectDto.parse(req.body);
      const subject = await subjectsService.create(dto);
      res.status(201).json(subject);
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
      const dto = UpdateSubjectDto.parse(req.body);
      const subject = await subjectsService.update(req.params.id, dto);
      res.status(200).json(subject);
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
      await subjectsService.softDelete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  addPrerequisite = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const dto = AddPrerequisiteDto.parse(req.body);
      const result = await subjectsService.addPrerequisite(
        req.params.id,
        dto.prerequisiteId,
      );
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  removePrerequisite = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await subjectsService.removePrerequisite(
        req.params.id,
        req.params.prereqId,
      );
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}

export const subjectsController = new SubjectsController();
