import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { classroomsController } from './classrooms.controller';

export const classroomsRouter = Router();

classroomsRouter.get('/', authenticate, classroomsController.findAll);
classroomsRouter.get('/:id', authenticate, classroomsController.findById);
classroomsRouter.post('/', authenticate, authorize('ADMIN'), classroomsController.create);
classroomsRouter.patch('/:id', authenticate, authorize('ADMIN'), classroomsController.update);
classroomsRouter.patch('/:id/toggle-active', authenticate, authorize('ADMIN'), classroomsController.toggleActive);
classroomsRouter.delete('/:id', authenticate, authorize('ADMIN'), classroomsController.softDelete);
