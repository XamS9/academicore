import { api } from "./api";

export const certificationsService = {
  getAll: () => api.get("/certifications").then((r) => r.data),
  getById: (id: string) => api.get(`/certifications/${id}`).then((r) => r.data),
  create: (data: unknown) =>
    api.post("/certifications", data).then((r) => r.data),
  update: (id: string, data: unknown) =>
    api.patch(`/certifications/${id}`, data).then((r) => r.data),
  delete: (id: string) =>
    api.delete(`/certifications/${id}`).then((r) => r.data),
  verify: (code: string) =>
    api.get(`/certifications/verify/${code}`).then((r) => r.data),
  issue: (data: unknown) =>
    api.post("/certifications/issue", data).then((r) => r.data),
  revoke: (id: string, reason: string) =>
    api.post(`/certifications/${id}/revoke`, { reason }).then((r) => r.data),
  getCriteria: () => api.get("/certifications/criteria").then((r) => r.data),
  getByStudent: (studentId: string) =>
    api.get(`/certifications/student/${studentId}`).then((r) => r.data),
  downloadPdf: (id: string) =>
    api
      .get(`/certifications/${id}/pdf`, { responseType: "blob" })
      .then((r) => r.data),
};
