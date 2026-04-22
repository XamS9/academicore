import { Request, Response, NextFunction } from "express";
import { StudentSubmissionsService } from "./student-submissions.service";
import {
  CreateStudentSubmissionSchema,
  UpdateStudentSubmissionSchema,
} from "./student-submissions.dto";
import {
  assertStudentPaidInscriptionForEvaluation,
  assertStudentResourceAccess,
  requireStudentId,
} from "../../shared/student-access";
import { HttpError } from "../../shared/http-error";

export class StudentSubmissionsController {
  constructor(private readonly service: StudentSubmissionsService) {}

  findByEvaluation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.findByEvaluation(req.params.evaluationId);
      res.json(data);
    } catch (err) {
      next(err);
    }
  };

  findMine = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = await requireStudentId(req.user!);
      const data = await this.service.findByStudent(studentId);
      const gated = [];
      for (const row of data) {
        try {
          await assertStudentPaidInscriptionForEvaluation(
            studentId,
            row.evaluationId,
          );
          gated.push(row);
        } catch {
          // Hidden until inscription fee is paid for the corresponding period/group.
        }
      }
      res.json(gated);
    } catch (err) {
      next(err);
    }
  };

  findByStudent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await assertStudentResourceAccess(req.user!, req.params.studentId);
      const data = await this.service.findByStudent(req.params.studentId);
      res.json(data);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = CreateStudentSubmissionSchema.parse(req.body);
      let studentId = parsed.studentId;
      if (req.user!.userType === "STUDENT") {
        const own = await requireStudentId(req.user!);
        if (studentId !== undefined && studentId !== own) {
          throw new HttpError(403, "Solo puedes entregar como tú mismo");
        }
        studentId = own;
        await assertStudentPaidInscriptionForEvaluation(
          studentId,
          parsed.evaluationId,
        );
      } else if (!studentId) {
        throw new HttpError(400, "studentId es requerido");
      }
      const data = await this.service.create({ ...parsed, studentId });
      res.status(201).json(data);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = UpdateStudentSubmissionSchema.parse(req.body);
      const data = await this.service.update(req.params.id, dto);
      res.json(data);
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
