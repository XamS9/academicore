import { api } from './api';

export const topicsService = {
  getByGroup: (groupId: string) => api.get(`/topics/group/${groupId}`).then(r => r.data),
  getById: (id: string) => api.get(`/topics/${id}`).then(r => r.data),
  create: (data: unknown) => api.post('/topics', data).then(r => r.data),
  update: (id: string, data: unknown) => api.patch(`/topics/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/topics/${id}`).then(r => r.data),
  reorder: (groupId: string, orderedIds: string[]) =>
    api.patch(`/topics/group/${groupId}/reorder`, { orderedIds }).then(r => r.data),
};
