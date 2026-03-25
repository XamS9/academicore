import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { enrollmentsService } from './enrollments.service';
import { EnrollmentsController } from './enrollments.controller';

export const enrollmentsRouter = Router();
const controller = new EnrollmentsController(enrollmentsService);

enrollmentsRouter.post('/enroll', authenticate, authorize('ADMIN'), controller.enrollStudent);
enrollmentsRouter.get('/student/:studentId', authenticate, controller.findByStudent);
enrollmentsRouter.get('/period/:periodId', authenticate, authorize('ADMIN'), controller.findByPeriod);
enrollmentsRouter.patch('/drop', authenticate, authorize('ADMIN'), controller.dropSubject);
