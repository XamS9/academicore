import { api } from "./api";

export const studentsService = {
  getAll: () => api.get("/students").then((r) => r.data),
  getById: (id: string) => api.get(`/students/${id}`).then((r) => r.data),
  getByUserId: (userId: string) =>
    api.get(`/students/by-user/${userId}`).then((r) => r.data),
  create: (data: unknown) => api.post("/students", data).then((r) => r.data),
  update: (id: string, data: unknown) =>
    api.patch(`/students/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/students/${id}`).then((r) => r.data),
};
