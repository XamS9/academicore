import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { evaluationTypesController } from './evaluation-types.controller';

export const evaluationTypesRouter = Router();

evaluationTypesRouter.get('/', authenticate, evaluationTypesController.findAll);
evaluationTypesRouter.post('/', authenticate, authorize('ADMIN'), evaluationTypesController.create);
