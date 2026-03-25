import { api } from './api';

export const evaluationsService = {
  getAll: () => api.get('/evaluations').then(r => r.data),
  getById: (id: string) => api.get(`/evaluations/${id}`).then(r => r.data),
  create: (data: unknown) => api.post('/evaluations', data).then(r => r.data),
  update: (id: string, data: unknown) => api.patch(`/evaluations/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/evaluations/${id}`).then(r => r.data),
};
