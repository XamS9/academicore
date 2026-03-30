import { Request, Response, NextFunction } from 'express';
import { notificationsService } from './notifications.service';
import { NotificationQuerySchema } from './notifications.dto';

class NotificationsController {
  findMine = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = NotificationQuerySchema.parse(req.query);
      const notifications = await notificationsService.findByUser(req.user!.sub, query);
      res.json(notifications);
    } catch (err) {
      next(err);
    }
  };

  unreadCount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const count = await notificationsService.unreadCount(req.user!.sub);
      res.json({ count });
    } catch (err) {
      next(err);
    }
  };

  markRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await notificationsService.markRead(req.params.id, req.user!.sub);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  };

  markAllRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await notificationsService.markAllRead(req.user!.sub);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  };
}

export const notificationsController = new NotificationsController();
