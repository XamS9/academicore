import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { teachersController } from './teachers.controller';

export const teachersRouter = Router();

teachersRouter.get('/', authenticate, authorize('ADMIN'), teachersController.findAll);
teachersRouter.get('/:id', authenticate, teachersController.findById);
teachersRouter.post('/', authenticate, authorize('ADMIN'), teachersController.create);
teachersRouter.patch('/:id', authenticate, authorize('ADMIN'), teachersController.update);
teachersRouter.delete('/:id', authenticate, authorize('ADMIN'), teachersController.softDelete);
