import { api } from "./api";

export const auditLogsService = {
  getAll: (params?: { entityType?: string; limit?: number }) =>
    api.get("/audit-logs", { params }).then((r) => r.data),
  getByEntity: (entityType: string, entityId: string) =>
    api.get(`/audit-logs/entity/${entityType}/${entityId}`).then((r) => r.data),
};
