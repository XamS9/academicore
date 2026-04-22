import { api } from "./api";

export const classroomsService = {
  getAll: () => api.get("/classrooms").then((r) => r.data),
  getById: (id: string) => api.get(`/classrooms/${id}`).then((r) => r.data),
  create: (data: unknown) => api.post("/classrooms", data).then((r) => r.data),
  update: (id: string, data: unknown) =>
    api.patch(`/classrooms/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/classrooms/${id}`).then((r) => r.data),
};
