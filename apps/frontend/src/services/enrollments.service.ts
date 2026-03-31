import { api } from "./api";

export const enrollmentsService = {
  getAll: () => api.get("/enrollments").then((r) => r.data),
  getById: (id: string) => api.get(`/enrollments/${id}`).then((r) => r.data),
  create: (data: unknown) => api.post("/enrollments", data).then((r) => r.data),
  update: (id: string, data: unknown) =>
    api.patch(`/enrollments/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/enrollments/${id}`).then((r) => r.data),
  enroll: (data: { studentId: string; groupId: string; periodId: string }) =>
    api.post("/enrollments/enroll", data).then((r) => r.data),
  getByStudent: (studentId: string) =>
    api.get(`/enrollments/student/${studentId}`).then((r) => r.data),
  dropSubject: (enrollmentSubjectId: string) =>
    api.patch("/enrollments/drop", { enrollmentSubjectId }).then((r) => r.data),
};
