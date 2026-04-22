import { Request, Response, NextFunction } from "express";
import { syllabusService } from "./syllabus.service";
import {
  CreateSyllabusTopicDto,
  UpdateSyllabusTopicDto,
  ReorderSyllabusTopicsDto,
  MarkTopicProgressDto,
} from "./syllabus.dto";
import { HttpError } from "../../shared/http-error";

class SyllabusController {
  listBySubject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const topics = await syllabusService.listBySubject(req.params.subjectId);
      res.json(topics);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = CreateSyllabusTopicDto.parse({
        ...req.body,
        subjectId: req.params.subjectId,
      });
      const topic = await syllabusService.create(dto);
      res.status(201).json(topic);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = UpdateSyllabusTopicDto.parse(req.body);
      const topic = await syllabusService.update(req.params.id, dto);
      res.json(topic);
    } catch (err) {
      next(err);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await syllabusService.remove(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  reorder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = ReorderSyllabusTopicsDto.parse(req.body);
      await syllabusService.reorder(req.params.subjectId, dto);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  getGroupProgress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new HttpError(401, "Unauthenticated");
      const isStudent = req.user.userType === "STUDENT";
      const data = isStudent
        ? await syllabusService.getProgressForStudent(req.params.groupId, req.user.sub)
        : await syllabusService.getGroupProgress(req.params.groupId);
      res.json(data);
    } catch (err) {
      next(err);
    }
  };

  markProgress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new HttpError(401, "Unauthenticated");
      const dto = MarkTopicProgressDto.parse(req.body);
      const result = await syllabusService.markProgress(
        req.params.groupId,
        req.user.sub,
        dto,
      );
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  removeProgress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new HttpError(401, "Unauthenticated");
      await syllabusService.removeProgress(
        req.params.groupId,
        req.params.topicId,
        req.user.sub,
      );
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}

export const syllabusController = new SyllabusController();
