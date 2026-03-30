import { Request, Response, NextFunction } from 'express';
import { calendarEventsService } from './calendar-events.service';
import { CreateCalendarEventDto, UpdateCalendarEventDto } from './calendar-events.dto';

class CalendarEventsController {
  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const periodId = req.query.periodId as string | undefined;
      const upcoming = req.query.upcoming === 'true';
      const events = await calendarEventsService.findAll({ periodId, upcoming });
      res.json(events);
    } catch (err) {
      next(err);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const event = await calendarEventsService.findById(req.params.id);
      res.json(event);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = CreateCalendarEventDto.parse(req.body);
      const event = await calendarEventsService.create(data);
      res.status(201).json(event);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = UpdateCalendarEventDto.parse(req.body);
      const event = await calendarEventsService.update(req.params.id, data);
      res.json(event);
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await calendarEventsService.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}

export const calendarEventsController = new CalendarEventsController();
