import { api } from './api';

export const teachersService = {
  getAll: () => api.get('/teachers').then(r => r.data),
  getById: (id: string) => api.get(`/teachers/${id}`).then(r => r.data),
  create: (data: unknown) => api.post('/teachers', data).then(r => r.data),
  update: (id: string, data: unknown) => api.patch(`/teachers/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/teachers/${id}`).then(r => r.data),
};
