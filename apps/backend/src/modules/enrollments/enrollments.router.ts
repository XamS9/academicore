import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { enrollmentsService } from './enrollments.service';
import { EnrollmentsController } from './enrollments.controller';

export const enrollmentsRouter = Router();
const controller = new EnrollmentsController(enrollmentsService);

enrollmentsRouter.post('/enroll', authenticate, authorize('ADMIN', 'STUDENT'), controller.enrollStudent);
enrollmentsRouter.get('/available-groups', authenticate, authorize('STUDENT'), controller.findAvailableGroups);
enrollmentsRouter.get('/student/:studentId', authenticate, controller.findByStudent);
enrollmentsRouter.get('/period/:periodId', authenticate, authorize('ADMIN'), controller.findByPeriod);
enrollmentsRouter.patch('/drop', authenticate, authorize('ADMIN'), controller.dropSubject);
