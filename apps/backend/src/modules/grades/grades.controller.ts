import { Request, Response, NextFunction } from 'express';
import { GradesService } from './grades.service';
import { UpsertGradeDto, BulkUpsertGradesDto } from './grades.dto';

export class GradesController {
  constructor(private service: GradesService) {}

  findByEvaluation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.findByEvaluation(req.params.evaluationId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  findByStudentAndGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.findByStudentAndGroup(
        req.params.studentId,
        req.params.groupId,
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  upsert = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = UpsertGradeDto.parse(req.body);
      const gradedBy = req.user!.sub;
      const result = await this.service.upsert(dto, gradedBy);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  bulkUpsert = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { grades } = BulkUpsertGradesDto.parse(req.body);
      const gradedBy = req.user!.sub;
      const result = await this.service.bulkUpsert(grades, gradedBy);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}
