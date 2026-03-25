import { api } from './api';

export const academicRecordsService = {
  getByStudent: (studentId: string) =>
    api.get(`/academic-records/student/${studentId}`).then(r => r.data),
  getByStudentAndPeriod: (studentId: string, periodId: string) =>
    api.get(`/academic-records/student/${studentId}/period/${periodId}`).then(r => r.data),
  getAveragesByPeriod: (studentId: string) =>
    api.get(`/academic-records/student/${studentId}/averages`).then(r => r.data),
  getPassed: (studentId: string) =>
    api.get(`/academic-records/student/${studentId}/passed`).then(r => r.data),
  getFailed: (studentId: string) =>
    api.get(`/academic-records/student/${studentId}/failed`).then(r => r.data),
};
