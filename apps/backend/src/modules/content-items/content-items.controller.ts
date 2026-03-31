import { Request, Response, NextFunction } from "express";
import { ContentItemsService } from "./content-items.service";
import {
  CreateContentItemDto,
  UpdateContentItemDto,
} from "./content-items.dto";

export class ContentItemsController {
  constructor(private service: ContentItemsService) {}

  findByTopic = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.service.findByTopic(req.params.topicId);
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
      const dto = CreateContentItemDto.parse(req.body);
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
      const dto = UpdateContentItemDto.parse(req.body);
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
}
