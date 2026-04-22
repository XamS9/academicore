import { api } from "./api";

export const studentsService = {
  getAll: () => api.get("/students").then((r) => r.data),
  /** Current student profile (STUDENT role only). */
  getMe: () => api.get("/students/me").then((r) => r.data),
  /** Dashboard payload: enrollments, fees, records, grades, certifications, schedule. */
  getMeOverview: () => api.get("/students/me/overview").then((r) => r.data),
  getById: (id: string) => api.get(`/students/${id}`).then((r) => r.data),
  getByUserId: (userId: string) =>
    api.get(`/students/by-user/${userId}`).then((r) => r.data),
  create: (data: unknown) => api.post("/students", data).then((r) => r.data),
  update: (id: string, data: unknown) =>
    api.patch(`/students/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/students/${id}`).then((r) => r.data),
  approve: (id: string) =>
    api.patch(`/students/${id}/approve`).then((r) => r.data),
};
