import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { careersController } from './careers.controller';

export const careersRouter = Router();

careersRouter.get('/', authenticate, careersController.findAll);
careersRouter.get('/:id', authenticate, careersController.findById);
careersRouter.post('/', authenticate, authorize('ADMIN'), careersController.create);
careersRouter.patch('/:id', authenticate, authorize('ADMIN'), careersController.update);
careersRouter.delete('/:id', authenticate, authorize('ADMIN'), careersController.softDelete);
