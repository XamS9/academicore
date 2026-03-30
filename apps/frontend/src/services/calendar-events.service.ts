import { api } from './api';

export const calendarEventsService = {
  getAll: (params?: { periodId?: string; upcoming?: boolean }) =>
    api.get('/calendar-events', { params }).then((r) => r.data),
  getById: (id: string) =>
    api.get(`/calendar-events/${id}`).then((r) => r.data),
  create: (data: unknown) =>
    api.post('/calendar-events', data).then((r) => r.data),
  update: (id: string, data: unknown) =>
    api.patch(`/calendar-events/${id}`, data).then((r) => r.data),
  delete: (id: string) =>
    api.delete(`/calendar-events/${id}`).then((r) => r.data),
};
