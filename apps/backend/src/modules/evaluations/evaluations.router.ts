import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { evaluationsService } from './evaluations.service';
import { EvaluationsController } from './evaluations.controller';

export const evaluationsRouter = Router();
const controller = new EvaluationsController(evaluationsService);

evaluationsRouter.get('/group/:groupId', authenticate, controller.findByGroup);
evaluationsRouter.get('/:id', authenticate, controller.findById);
evaluationsRouter.post('/', authenticate, authorize('ADMIN', 'TEACHER'), controller.create);
evaluationsRouter.patch('/:id', authenticate, authorize('ADMIN', 'TEACHER'), controller.update);
evaluationsRouter.delete('/:id', authenticate, authorize('ADMIN', 'TEACHER'), controller.delete);
