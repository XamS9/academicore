import { api } from './api';

export const subjectsService = {
  getAll: () => api.get('/subjects').then(r => r.data),
  getById: (id: string) => api.get(`/subjects/${id}`).then(r => r.data),
  create: (data: unknown) => api.post('/subjects', data).then(r => r.data),
  update: (id: string, data: unknown) => api.patch(`/subjects/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/subjects/${id}`).then(r => r.data),
};
