import { api } from "./api";

export const announcementsService = {
  getAll: () => api.get("/announcements").then((r) => r.data),
  getMy: () => api.get("/announcements/my").then((r) => r.data),
  getById: (id: string) => api.get(`/announcements/${id}`).then((r) => r.data),
  create: (data: unknown) =>
    api.post("/announcements", data).then((r) => r.data),
  update: (id: string, data: unknown) =>
    api.patch(`/announcements/${id}`, data).then((r) => r.data),
  delete: (id: string) =>
    api.delete(`/announcements/${id}`).then((r) => r.data),
};
