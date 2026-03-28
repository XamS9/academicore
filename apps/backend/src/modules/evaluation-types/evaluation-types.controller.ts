import { Request, Response, NextFunction } from 'express';
import { evaluationTypesService } from './evaluation-types.service';
import { CreateEvaluationTypeDto } from './evaluation-types.dto';

class EvaluationTypesController {
  findAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const types = await evaluationTypesService.findAll();
      res.status(200).json(types);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = CreateEvaluationTypeDto.parse(req.body);
      const type = await evaluationTypesService.create(dto);
      res.status(201).json(type);
    } catch (err) {
      next(err);
    }
  };
}

export const evaluationTypesController = new EvaluationTypesController();
