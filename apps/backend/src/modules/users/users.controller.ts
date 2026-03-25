import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './users.dto';

class UsersController {
  findAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const users = await usersService.findAll();
      res.status(200).json(users);
    } catch (err) {
      next(err);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await usersService.findById(req.params.id);
      res.status(200).json(user);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = CreateUserDto.parse(req.body);
      const user = await usersService.create(dto);
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = UpdateUserDto.parse(req.body);
      const user = await usersService.update(req.params.id, dto);
      res.status(200).json(user);
    } catch (err) {
      next(err);
    }
  };

  softDelete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await usersService.softDelete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  toggleActive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await usersService.toggleActive(req.params.id);
      res.status(200).json(user);
    } catch (err) {
      next(err);
    }
  };
}

export const usersController = new UsersController();
