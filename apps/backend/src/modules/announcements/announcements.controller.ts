import { Request, Response, NextFunction } from "express";
import { announcementsService } from "./announcements.service";
import {
  AnnouncementListQueryDto,
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
} from "./announcements.dto";

class AnnouncementsController {
  findAll = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const q = AnnouncementListQueryDto.parse(req.query);
      const result = await announcementsService.findAll(q);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  findMy = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const q = AnnouncementListQueryDto.parse(req.query);
      const result = await announcementsService.findMy(
        req.user!.sub,
        req.user!.userType,
        q,
      );
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
      const announcement = await announcementsService.findById(req.params.id);
      res.json(announcement);
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
      const data = CreateAnnouncementDto.parse(req.body);
      const announcement = await announcementsService.create(
        req.user!.sub,
        data,
      );
      res.status(201).json(announcement);
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
      const data = UpdateAnnouncementDto.parse(req.body);
      const announcement = await announcementsService.update(
        req.params.id,
        data,
      );
      res.json(announcement);
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
      await announcementsService.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}

export const announcementsController = new AnnouncementsController();
