import { Request, Response, NextFunction } from "express";
import { StudentSubmissionsService } from "./student-submissions.service";
import {
  CreateStudentSubmissionSchema,
  UpdateStudentSubmissionSchema,
} from "./student-submissions.dto";

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

  findByStudent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.findByStudent(req.params.studentId);
      res.json(data);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = CreateStudentSubmissionSchema.parse(req.body);
      const data = await this.service.create(dto);
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
