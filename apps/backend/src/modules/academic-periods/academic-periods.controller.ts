import { Request, Response, NextFunction } from 'express';
import { academicPeriodsService } from './academic-periods.service';
import { CreateAcademicPeriodDto, UpdateAcademicPeriodDto } from './academic-periods.dto';

class AcademicPeriodsController {
  findAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const periods = await academicPeriodsService.findAll();
      res.status(200).json(periods);
    } catch (err) {
      next(err);
    }
  };

  findActive = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const periods = await academicPeriodsService.findActive();
      res.status(200).json(periods);
    } catch (err) {
      next(err);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const period = await academicPeriodsService.findById(req.params.id);
      res.status(200).json(period);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = CreateAcademicPeriodDto.parse(req.body);
      const period = await academicPeriodsService.create(dto);
      res.status(201).json(period);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = UpdateAcademicPeriodDto.parse(req.body);
      const period = await academicPeriodsService.update(req.params.id, dto);
      res.status(200).json(period);
    } catch (err) {
      next(err);
    }
  };

  toggleEnrollment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const period = await academicPeriodsService.toggleEnrollment(req.params.id);
      res.status(200).json(period);
    } catch (err) {
      next(err);
    }
  };
}

export const academicPeriodsController = new AcademicPeriodsController();
