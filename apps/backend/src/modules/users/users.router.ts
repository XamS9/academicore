import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { usersController } from './users.controller';

export const usersRouter = Router();

usersRouter.get('/', authenticate, authorize('ADMIN'), usersController.findAll);
usersRouter.get('/:id', authenticate, authorize('ADMIN'), usersController.findById);
usersRouter.post('/', authenticate, authorize('ADMIN'), usersController.create);
usersRouter.patch('/:id', authenticate, authorize('ADMIN'), usersController.update);
usersRouter.delete('/:id', authenticate, authorize('ADMIN'), usersController.softDelete);
usersRouter.patch('/:id/toggle-active', authenticate, authorize('ADMIN'), usersController.toggleActive);
