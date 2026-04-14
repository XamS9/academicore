import { api } from "./api";

export const academicRecordsService = {
  getMine: () => api.get("/academic-records/me").then((r) => r.data),
  getMineAndPeriod: (periodId: string) =>
    api.get(`/academic-records/me/period/${periodId}`).then((r) => r.data),
  getMyAveragesByPeriod: () =>
    api.get("/academic-records/me/averages").then((r) => r.data),
  getMyPassed: () => api.get("/academic-records/me/passed").then((r) => r.data),
  getMyFailed: () => api.get("/academic-records/me/failed").then((r) => r.data),
  getByStudent: (studentId: string) =>
    api.get(`/academic-records/student/${studentId}`).then((r) => r.data),
  getByStudentAndPeriod: (studentId: string, periodId: string) =>
    api
      .get(`/academic-records/student/${studentId}/period/${periodId}`)
      .then((r) => r.data),
  getAveragesByPeriod: (studentId: string) =>
    api
      .get(`/academic-records/student/${studentId}/averages`)
      .then((r) => r.data),
  getPassed: (studentId: string) =>
    api
      .get(`/academic-records/student/${studentId}/passed`)
      .then((r) => r.data),
  getFailed: (studentId: string) =>
    api
      .get(`/academic-records/student/${studentId}/failed`)
      .then((r) => r.data),
};
