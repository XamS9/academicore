import { Request, Response, NextFunction } from "express";
import { AcademicRecordsService } from "./academic-records.service";
import { assertStudentResourceAccess, requireStudentId } from "../../shared/student-access";

export class AcademicRecordsController {
  constructor(private service: AcademicRecordsService) {}

  findMine = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const studentId = await requireStudentId(req.user!);
      const result = await this.service.findByStudent(studentId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  findMineAndPeriod = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const studentId = await requireStudentId(req.user!);
      const result = await this.service.findByStudentAndPeriod(
        studentId,
        req.params.periodId,
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  getMyAverageByPeriod = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const studentId = await requireStudentId(req.user!);
      const result = await this.service.getStudentAverageByPeriod(studentId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  getMyPassedSubjects = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const studentId = await requireStudentId(req.user!);
      const result = await this.service.getPassedSubjects(studentId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  getMyFailedSubjects = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const studentId = await requireStudentId(req.user!);
      const result = await this.service.getFailedSubjects(studentId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  findByStudent = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await assertStudentResourceAccess(req.user!, req.params.studentId);
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
      await assertStudentResourceAccess(req.user!, req.params.studentId);
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
      await assertStudentResourceAccess(req.user!, req.params.studentId);
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
      await assertStudentResourceAccess(req.user!, req.params.studentId);
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
      await assertStudentResourceAccess(req.user!, req.params.studentId);
      const result = await this.service.getFailedSubjects(req.params.studentId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}
