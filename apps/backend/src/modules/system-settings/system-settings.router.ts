import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { systemSettingsService } from './system-settings.service';
import { SystemSettingsController } from './system-settings.controller';

export const systemSettingsRouter = Router();
const controller = new SystemSettingsController(systemSettingsService);

systemSettingsRouter.get('/', authenticate, controller.get);
systemSettingsRouter.patch('/', authenticate, authorize('ADMIN'), controller.update);
