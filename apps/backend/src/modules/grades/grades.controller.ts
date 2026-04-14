import { Request, Response, NextFunction } from "express";
import { GradesService } from "./grades.service";
import { UpsertGradeDto, BulkUpsertGradesDto } from "./grades.dto";
import {
  assertStudentEnrolledInGroup,
  assertStudentResourceAccess,
  requireStudentId,
} from "../../shared/student-access";

export class GradesController {
  constructor(private service: GradesService) {}

  findByEvaluation = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.service.findByEvaluation(
        req.params.evaluationId,
      );
      if (req.user!.userType === "STUDENT") {
        const studentId = await requireStudentId(req.user!);
        res.json(result.filter((g) => g.studentId === studentId));
        return;
      }
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  findMineByGroup = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const studentId = await requireStudentId(req.user!);
      await assertStudentEnrolledInGroup(studentId, req.params.groupId);
      const result = await this.service.findByStudentAndGroup(
        studentId,
        req.params.groupId,
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  findByStudentAndGroup = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await assertStudentResourceAccess(req.user!, req.params.studentId);
      if (req.user!.userType === "STUDENT") {
        await assertStudentEnrolledInGroup(
          req.params.studentId,
          req.params.groupId,
        );
      }
      const result = await this.service.findByStudentAndGroup(
        req.params.studentId,
        req.params.groupId,
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  upsert = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const dto = UpsertGradeDto.parse(req.body);
      const gradedBy = req.user!.sub;
      const result = await this.service.upsert(dto, gradedBy);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  bulkUpsert = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
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
