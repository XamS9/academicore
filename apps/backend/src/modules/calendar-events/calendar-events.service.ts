import { prisma } from '../../shared/prisma.client';
import { HttpError } from '../../shared/http-error';
import type { CreateCalendarEventInput, UpdateCalendarEventInput } from './calendar-events.dto';

export class CalendarEventsService {
  async findAll(filters?: { periodId?: string; upcoming?: boolean }) {
    return prisma.calendarEvent.findMany({
      where: {
        ...(filters?.periodId ? { periodId: filters.periodId } : {}),
        ...(filters?.upcoming ? { endDate: { gte: new Date() } } : {}),
      },
      include: { period: { select: { id: true, name: true } } },
      orderBy: { startDate: 'asc' },
    });
  }

  async findById(id: string) {
    const event = await prisma.calendarEvent.findUnique({
      where: { id },
      include: { period: { select: { id: true, name: true } } },
    });
    if (!event) throw new HttpError(404, 'Evento no encontrado');
    return event;
  }

  async create(data: CreateCalendarEventInput) {
    return prisma.calendarEvent.create({ data });
  }

  async update(id: string, data: UpdateCalendarEventInput) {
    await this.findById(id);
    return prisma.calendarEvent.update({ where: { id }, data });
  }

  async delete(id: string) {
    await this.findById(id);
    return prisma.calendarEvent.delete({ where: { id } });
  }
}

export const calendarEventsService = new CalendarEventsService();
