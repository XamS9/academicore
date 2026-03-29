import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { topicsService } from './topics.service';
import { TopicsController } from './topics.controller';

export const topicsRouter = Router();
const controller = new TopicsController(topicsService);

topicsRouter.get('/group/:groupId', authenticate, controller.findByGroup);
topicsRouter.get('/:id', authenticate, controller.findById);
topicsRouter.post('/', authenticate, authorize('ADMIN', 'TEACHER'), controller.create);
topicsRouter.patch('/:id', authenticate, authorize('ADMIN', 'TEACHER'), controller.update);
topicsRouter.delete('/:id', authenticate, authorize('ADMIN', 'TEACHER'), controller.delete);
topicsRouter.patch('/group/:groupId/reorder', authenticate, authorize('ADMIN', 'TEACHER'), controller.reorder);
