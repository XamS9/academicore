import { api } from "./api";

export const academicPeriodsService = {
  getAll: () => api.get("/academic-periods").then((r) => r.data),
  getById: (id: string) =>
    api.get(`/academic-periods/${id}`).then((r) => r.data),
  create: (data: unknown) =>
    api.post("/academic-periods", data).then((r) => r.data),
  update: (id: string, data: unknown) =>
    api.patch(`/academic-periods/${id}`, data).then((r) => r.data),
  delete: (id: string) =>
    api.delete(`/academic-periods/${id}`).then((r) => r.data),
  getProgress: (id: string) =>
    api.get(`/academic-periods/${id}/progress`).then((r) => r.data),
  startGrading: (id: string) =>
    api.patch(`/academic-periods/${id}/start-grading`).then((r) => r.data),
  closePeriod: (id: string, force = false) =>
    api.post(`/academic-periods/${id}/close`, { force }).then((r) => r.data),
};
