import { Request, Response, NextFunction } from "express";
import { studentsService } from "./students.service";
import { CreateStudentDto, UpdateStudentDto } from "./students.dto";
import { HttpError } from "../../shared/http-error";

class StudentsController {
  findAll = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const students = await studentsService.findAll();
      res.status(200).json(students);
    } catch (err) {
      next(err);
    }
  };

  findMe = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (req.user!.userType !== "STUDENT") {
        throw new HttpError(403, "Solo disponible para estudiantes");
      }
      const student = await studentsService.findByUserId(req.user!.sub);
      res.status(200).json(student);
    } catch (err) {
      next(err);
    }
  };

  findMeOverview = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (req.user!.userType !== "STUDENT") {
        throw new HttpError(403, "Solo disponible para estudiantes");
      }
      const overview = await studentsService.getOverviewByUserId(req.user!.sub);
      res.status(200).json(overview);
    } catch (err) {
      next(err);
    }
  };

  findById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (req.params.id === "me" || req.params.id === "overview") {
        throw new HttpError(404, "Student not found");
      }
      const student = await studentsService.findById(req.params.id);
      res.status(200).json(student);
    } catch (err) {
      next(err);
    }
  };

  findByUserId = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (
        req.user!.userType === "STUDENT" &&
        req.params.userId !== req.user!.sub
      ) {
        throw new HttpError(403, "No autorizado");
      }
      const student = await studentsService.findByUserId(req.params.userId);
      res.status(200).json(student);
    } catch (err) {
      next(err);
    }
  };

  create = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const dto = CreateStudentDto.parse(req.body);
      const student = await studentsService.create(dto);
      res.status(201).json(student);
    } catch (err) {
      next(err);
    }
  };

  update = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const dto = UpdateStudentDto.parse(req.body);
      const student = await studentsService.update(req.params.id, dto);
      res.status(200).json(student);
    } catch (err) {
      next(err);
    }
  };

  approve = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const student = await studentsService.approve(req.params.id);
      res.status(200).json(student);
    } catch (err) {
      next(err);
    }
  };

  softDelete = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await studentsService.softDelete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}

export const studentsController = new StudentsController();
