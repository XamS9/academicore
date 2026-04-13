import { Request, Response, NextFunction } from "express";
import { TopicsService } from "./topics.service";
import { CreateTopicDto, UpdateTopicDto, ReorderTopicsDto } from "./topics.dto";

export class TopicsController {
  constructor(private service: TopicsService) {}

  findByGroup = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.service.findByGroup(req.params.groupId);
      res.json(result);
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
      const result = await this.service.findById(req.params.id);
      res.json(result);
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
      const dto = CreateTopicDto.parse(req.body);
      const result = await this.service.create(dto);
      res.status(201).json(result);
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
      const dto = UpdateTopicDto.parse(req.body);
      const result = await this.service.update(req.params.id, dto);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  delete = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await this.service.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  reorder = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { orderedIds } = ReorderTopicsDto.parse(req.body);
      await this.service.reorder(req.params.groupId, orderedIds);
      const result = await this.service.findByGroup(req.params.groupId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

}
