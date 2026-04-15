import { Request, Response, NextFunction } from "express";
import { EnrollmentsService } from "./enrollments.service";
import { EnrollStudentDto, DropSubjectDto } from "./enrollments.dto";
import { HttpError } from "../../shared/http-error";
import { assertStudentResourceAccess, requireStudentId } from "../../shared/student-access";

export class EnrollmentsController {
  constructor(private service: EnrollmentsService) {}

  enrollStudent = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const parsed = EnrollStudentDto.parse(req.body);

      let studentId = parsed.studentId;
      if (req.user!.userType === "STUDENT") {
        const ownId = await requireStudentId(req.user!);
        if (studentId !== undefined && studentId !== ownId) {
          throw new HttpError(403, "Solo puedes inscribirte a ti mismo");
        }
        studentId = ownId;
      } else if (req.user!.userType === "ADMIN") {
        if (!studentId) {
          throw new HttpError(400, "studentId es requerido para inscripción por administrador");
        }
      } else {
        throw new HttpError(403, "No autorizado");
      }

      const dto = { ...parsed, studentId };
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

  findMySchedule = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const studentId = await requireStudentId(req.user!);
      const result = await this.service.getScheduleForStudent(studentId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  getMyNavState = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.service.getStudentNavState(req.user!.sub);
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
      const result = await this.service.dropSubject(dto.enrollmentSubjectId, req.user!);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}
