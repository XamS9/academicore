import { api } from './api';

export const evaluationTypesService = {
  getAll: () => api.get('/evaluation-types').then(r => r.data),
};
