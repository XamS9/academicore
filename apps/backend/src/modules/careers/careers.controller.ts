import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { careersService } from "./careers.service";
import {
  AddCareerSubjectDto,
  CreateCareerDto,
  UpdateCareerDto,
  UpdateCareerSubjectDto,
} from "./careers.dto";

const SuggestCareerCodeQuery = z.object({
  name: z.string().min(1).max(200),
});

class CareersController {
  findAll = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const careers = await careersService.findAll();
      res.status(200).json(careers);
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
      const career = await careersService.findById(req.params.id);
      res.status(200).json(career);
    } catch (err) {
      next(err);
    }
  };

  suggestCode = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const q = SuggestCareerCodeQuery.parse(req.query);
      const result = await careersService.suggestCode(q.name);
      res.status(200).json(result);
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
      const dto = CreateCareerDto.parse(req.body);
      const career = await careersService.create(dto);
      res.status(201).json(career);
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
      const dto = UpdateCareerDto.parse(req.body);
      const career = await careersService.update(req.params.id, dto);
      res.status(200).json(career);
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
      await careersService.softDelete(req.params.id);
      res.status(204).send();
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
      const career = await careersService.toggleActive(req.params.id);
      res.status(200).json(career);
    } catch (err) {
      next(err);
    }
  };

  addSubject = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const dto = AddCareerSubjectDto.parse(req.body);
      const row = await careersService.addSubject(req.params.id, dto);
      res.status(201).json(row);
    } catch (err) {
      next(err);
    }
  };

  updateCareerSubject = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const dto = UpdateCareerSubjectDto.parse(req.body);
      const row = await careersService.updateCareerSubject(
        req.params.id,
        req.params.subjectId,
        dto,
      );
      res.status(200).json(row);
    } catch (err) {
      next(err);
    }
  };

  removeSubject = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await careersService.removeSubject(req.params.id, req.params.subjectId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}

export const careersController = new CareersController();
