import { api } from "./api";

export const gradesService = {
  getAll: () => api.get("/grades").then((r) => r.data),
  getByEvaluation: (evaluationId: string) =>
    api.get(`/grades/evaluation/${evaluationId}`).then((r) => r.data),
  getMineByGroup: (groupId: string) =>
    api.get(`/grades/me/group/${groupId}`).then((r) => r.data),
  /** Past/completed enrollments (COMPLETED/FAILED); not limited to status=ENROLLED. */
  getMineByGroupHistory: (groupId: string) =>
    api.get(`/grades/me/group/${groupId}/history`).then((r) => r.data),
  getByStudentAndGroup: (studentId: string, groupId: string) =>
    api
      .get(`/grades/student/${studentId}/group/${groupId}`)
      .then((r) => r.data),
  getById: (id: string) => api.get(`/grades/${id}`).then((r) => r.data),
  create: (data: unknown) => api.post("/grades", data).then((r) => r.data),
  upsert: (data: unknown) => api.post("/grades", data).then((r) => r.data),
  bulkUpsert: (grades: unknown[]) =>
    api.post("/grades/bulk", { grades }).then((r) => r.data),
  update: (id: string, data: unknown) =>
    api.patch(`/grades/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/grades/${id}`).then((r) => r.data),
};
