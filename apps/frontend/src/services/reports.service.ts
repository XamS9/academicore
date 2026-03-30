import { api } from './api';

export const reportsService = {
  getEnrollmentStats: () => api.get('/reports/enrollment-stats').then((r) => r.data),
  getPassFail: () => api.get('/reports/pass-fail').then((r) => r.data),
  getGpaTrends: () => api.get('/reports/gpa-trends').then((r) => r.data),
  getAtRisk: () => api.get('/reports/at-risk').then((r) => r.data),
  getSummary: () => api.get('/reports/summary').then((r) => r.data),
};
