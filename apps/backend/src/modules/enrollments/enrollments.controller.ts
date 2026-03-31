import { Request, Response, NextFunction } from "express";
import { EnrollmentsService } from "./enrollments.service";
import { EnrollStudentDto, DropSubjectDto } from "./enrollments.dto";
import { HttpError } from "../../shared/http-error";

export class EnrollmentsController {
  constructor(private service: EnrollmentsService) {}

  enrollStudent = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const dto = EnrollStudentDto.parse(req.body);

      // If caller is STUDENT, they can only enroll themselves
      if (req.user!.userType === "STUDENT") {
        const student = await this.service.getStudentByUserId(req.user!.sub);
        if (!student || student.id !== dto.studentId) {
          throw new HttpError(403, "Solo puedes inscribirte a ti mismo");
        }
      }

      const result = await this.service.enrollStudent(dto);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  findAvailableGroups = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const groups = await this.service.findAvailableGroups(req.user!.sub);
      res.json(groups);
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
      const result = await this.service.findByStudent(req.params.studentId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  findByPeriod = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.service.findByPeriod(req.params.periodId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  dropSubject = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const dto = DropSubjectDto.parse(req.body);
      const result = await this.service.dropSubject(dto.enrollmentSubjectId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}
