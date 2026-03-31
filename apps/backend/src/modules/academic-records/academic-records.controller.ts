import { Request, Response, NextFunction } from "express";
import { AcademicRecordsService } from "./academic-records.service";

export class AcademicRecordsController {
  constructor(private service: AcademicRecordsService) {}

  findByStudent = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.service.findByStudent(req.params.studentId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  findByStudentAndPeriod = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.service.findByStudentAndPeriod(
        req.params.studentId,
        req.params.periodId,
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  getStudentAverageByPeriod = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.service.getStudentAverageByPeriod(
        req.params.studentId,
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  getPassedSubjects = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.service.getPassedSubjects(req.params.studentId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  getFailedSubjects = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.service.getFailedSubjects(req.params.studentId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}
