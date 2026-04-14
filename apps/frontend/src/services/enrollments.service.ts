import { api } from "./api";

export const enrollmentsService = {
  getByPeriod: (periodId: string) =>
    api.get(`/enrollments/period/${periodId}`).then((r) => r.data),
  /** Current student's enrollments (STUDENT only). */
  getMine: () => api.get("/enrollments/me").then((r) => r.data),
  /** Class schedule for active period (STUDENT only). */
  getMySchedule: () => api.get("/enrollments/me/schedule").then((r) => r.data),
  getByStudent: (studentId: string) =>
    api.get(`/enrollments/student/${studentId}`).then((r) => r.data),
  getAvailableGroups: () =>
    api.get("/enrollments/available-groups").then((r) => r.data),
  /** Self-enroll: omit studentId; admin enrollments must include studentId. */
  enroll: (data: {
    groupId: string;
    periodId: string;
    studentId?: string;
  }) => api.post("/enrollments/enroll", data).then((r) => r.data),
  dropSubject: (enrollmentSubjectId: string) =>
    api.patch("/enrollments/drop", { enrollmentSubjectId }).then((r) => r.data),
};
