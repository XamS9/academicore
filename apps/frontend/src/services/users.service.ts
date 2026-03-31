import { api } from "./api";

export const usersService = {
  getAll: () => api.get("/users").then((r) => r.data),
  getById: (id: string) => api.get(`/users/${id}`).then((r) => r.data),
  create: (data: unknown) => api.post("/users", data).then((r) => r.data),
  update: (id: string, data: unknown) =>
    api.patch(`/users/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/users/${id}`).then((r) => r.data),
};
