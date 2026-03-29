import { api } from './api';

export const contentItemsService = {
  getByTopic: (topicId: string) => api.get(`/content-items/topic/${topicId}`).then(r => r.data),
  getById: (id: string) => api.get(`/content-items/${id}`).then(r => r.data),
  create: (data: unknown) => api.post('/content-items', data).then(r => r.data),
  update: (id: string, data: unknown) => api.patch(`/content-items/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/content-items/${id}`).then(r => r.data),
};
