import { api } from './api';

export const gradesService = {
  getAll: () => api.get('/grades').then(r => r.data),
  getById: (id: string) => api.get(`/grades/${id}`).then(r => r.data),
  create: (data: unknown) => api.post('/grades', data).then(r => r.data),
  update: (id: string, data: unknown) => api.patch(`/grades/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/grades/${id}`).then(r => r.data),
};
