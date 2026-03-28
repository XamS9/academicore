import { Request, Response, NextFunction } from 'express';
import { careersService } from './careers.service';
import { CreateCareerDto, UpdateCareerDto } from './careers.dto';

class CareersController {
  findAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const careers = await careersService.findAll();
      res.status(200).json(careers);
    } catch (err) {
      next(err);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const career = await careersService.findById(req.params.id);
      res.status(200).json(career);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = CreateCareerDto.parse(req.body);
      const career = await careersService.create(dto);
      res.status(201).json(career);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = UpdateCareerDto.parse(req.body);
      const career = await careersService.update(req.params.id, dto);
      res.status(200).json(career);
    } catch (err) {
      next(err);
    }
  };

  softDelete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await careersService.softDelete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  toggleActive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const career = await careersService.toggleActive(req.params.id);
      res.status(200).json(career);
    } catch (err) {
      next(err);
    }
  };
}

export const careersController = new CareersController();
