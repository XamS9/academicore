import { api } from "./api";

export const paymentsService = {
  // Fee concepts
  getFeeConcepts: () => api.get("/payments/fee-concepts").then((r) => r.data),
  createFeeConcept: (data: unknown) =>
    api.post("/payments/fee-concepts", data).then((r) => r.data),
  updateFeeConcept: (id: string, data: unknown) =>
    api.patch(`/payments/fee-concepts/${id}`, data).then((r) => r.data),

  // Student fees
  getStudentFees: (params?: {
    studentId?: string;
    periodId?: string;
    status?: string;
  }) => api.get("/payments/student-fees", { params }).then((r) => r.data),
  assignFee: (data: unknown) =>
    api.post("/payments/student-fees", data).then((r) => r.data),
  bulkAssignFees: (data: unknown) =>
    api.post("/payments/student-fees/bulk", data).then((r) => r.data),

  // Payment
  pay: (studentFeeId: string, data: { method: string }) =>
    api.post(`/payments/pay/${studentFeeId}`, data).then((r) => r.data),
  getHistory: () => api.get("/payments/history").then((r) => r.data),
};
