import { api } from "./api";

export const groupsService = {
  getAll: () => api.get("/groups").then((r) => r.data),
  /** ADMIN: code that would be used on create if groupCode is omitted (subject + period). */
  previewGroupCode: (subjectId: string, academicPeriodId: string) =>
    api
      .get<{ code: string }>("/groups/preview-group-code", {
        params: { subjectId, academicPeriodId },
      })
      .then((r) => r.data),
  getById: (id: string) => api.get(`/groups/${id}`).then((r) => r.data),
  getByTeacher: (teacherId: string) =>
    api.get(`/groups/teacher/${teacherId}`).then((r) => r.data),
  create: (data: unknown) => api.post("/groups", data).then((r) => r.data),
  update: (id: string, data: unknown) =>
    api.patch(`/groups/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/groups/${id}`).then((r) => r.data),
  getStudentsByGroup: (groupId: string) =>
    api.get(`/groups/${groupId}/students`).then((r) => r.data),
  assignClassroom: (groupId: string, data: unknown) =>
    api.post(`/groups/${groupId}/classrooms`, data).then((r) => r.data),
};
