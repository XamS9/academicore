import { Request, Response, NextFunction } from 'express';
import { groupsService } from './groups.service';
import { CreateGroupDto, UpdateGroupDto, AssignClassroomDto } from './groups.dto';

class GroupsController {
  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const periodId = req.query.periodId as string | undefined;
      const groups = await groupsService.findAll(periodId);
      res.status(200).json(groups);
    } catch (err) {
      next(err);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const group = await groupsService.findById(req.params.id);
      res.status(200).json(group);
    } catch (err) {
      next(err);
    }
  };

  findByTeacher = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const groups = await groupsService.findByTeacher(req.params.teacherId);
      res.status(200).json(groups);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = CreateGroupDto.parse(req.body);
      const group = await groupsService.create(dto);
      res.status(201).json(group);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = UpdateGroupDto.parse(req.body);
      const group = await groupsService.update(req.params.id, dto);
      res.status(200).json(group);
    } catch (err) {
      next(err);
    }
  };

  assignClassroom = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = AssignClassroomDto.parse(req.body);
      const result = await groupsService.assignClassroom(req.params.id, dto);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };
}

export const groupsController = new GroupsController();
