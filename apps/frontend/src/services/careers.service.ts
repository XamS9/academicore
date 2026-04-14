import { api } from "./api";

export const careersService = {
  getAll: () => api.get("/careers").then((r) => r.data),
  /** ADMIN: next unique code from name (same logic as create without manual code). */
  suggestCode: (name: string) =>
    api
      .get<{ code: string }>("/careers/suggest-code", { params: { name } })
      .then((r) => r.data),
  getById: (id: string) => api.get(`/careers/${id}`).then((r) => r.data),
  create: (data: unknown) => api.post("/careers", data).then((r) => r.data),
  update: (id: string, data: unknown) =>
    api.patch(`/careers/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/careers/${id}`).then((r) => r.data),
  addSubject: (careerId: string, data: unknown) =>
    api.post(`/careers/${careerId}/subjects`, data).then((r) => r.data),
  updateCareerSubject: (
    careerId: string,
    subjectId: string,
    data: unknown,
  ) =>
    api
      .patch(`/careers/${careerId}/subjects/${subjectId}`, data)
      .then((r) => r.data),
  removeSubject: (careerId: string, subjectId: string) =>
    api.delete(`/careers/${careerId}/subjects/${subjectId}`).then((r) => r.data),
};
