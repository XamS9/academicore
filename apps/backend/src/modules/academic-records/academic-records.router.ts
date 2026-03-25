import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { AcademicRecordsController } from './academic-records.controller';
import { AcademicRecordsService } from './academic-records.service';

const controller = new AcademicRecordsController(new AcademicRecordsService());

export const academicRecordsRouter = Router();

academicRecordsRouter.get('/student/:studentId',                       authenticate, controller.findByStudent);
academicRecordsRouter.get('/student/:studentId/period/:periodId',      authenticate, controller.findByStudentAndPeriod);
academicRecordsRouter.get('/student/:studentId/averages',              authenticate, controller.getStudentAverageByPeriod);
academicRecordsRouter.get('/student/:studentId/passed',                authenticate, controller.getPassedSubjects);
academicRecordsRouter.get('/student/:studentId/failed',                authenticate, controller.getFailedSubjects);
