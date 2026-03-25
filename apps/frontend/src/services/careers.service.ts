import { api } from './api';

export const careersService = {
  getAll: () => api.get('/careers').then(r => r.data),
  getById: (id: string) => api.get(`/careers/${id}`).then(r => r.data),
  create: (data: unknown) => api.post('/careers', data).then(r => r.data),
  update: (id: string, data: unknown) => api.patch(`/careers/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/careers/${id}`).then(r => r.data),
};
