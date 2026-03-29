import { Request, Response, NextFunction } from 'express';
import { SystemSettingsService } from './system-settings.service';
import { UpdateSystemSettingsDto } from './system-settings.dto';

export class SystemSettingsController {
  constructor(private service: SystemSettingsService) {}

  get = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.get();
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = UpdateSystemSettingsDto.parse(req.body);
      const result = await this.service.update(dto, req.user!.sub);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}
