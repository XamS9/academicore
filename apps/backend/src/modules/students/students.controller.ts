import { Request, Response, NextFunction } from 'express';
import { studentsService } from './students.service';
import { CreateStudentDto, UpdateStudentDto } from './students.dto';

class StudentsController {
  findAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const students = await studentsService.findAll();
      res.status(200).json(students);
    } catch (err) {
      next(err);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const student = await studentsService.findById(req.params.id);
      res.status(200).json(student);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = CreateStudentDto.parse(req.body);
      const student = await studentsService.create(dto);
      res.status(201).json(student);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = UpdateStudentDto.parse(req.body);
      const student = await studentsService.update(req.params.id, dto);
      res.status(200).json(student);
    } catch (err) {
      next(err);
    }
  };

  softDelete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await studentsService.softDelete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}

export const studentsController = new StudentsController();
