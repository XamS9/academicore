import { api } from "./api";

export const enrollmentsService = {
  getByPeriod: (periodId: string) =>
    api.get(`/enrollments/period/${periodId}`).then((r) => r.data),
  getByStudent: (studentId: string) =>
    api.get(`/enrollments/student/${studentId}`).then((r) => r.data),
  getAvailableGroups: () =>
    api.get("/enrollments/available-groups").then((r) => r.data),
  enroll: (data: { studentId: string; groupId: string; periodId: string }) =>
    api.post("/enrollments/enroll", data).then((r) => r.data),
  dropSubject: (enrollmentSubjectId: string) =>
    api.patch("/enrollments/drop", { enrollmentSubjectId }).then((r) => r.data),
};
