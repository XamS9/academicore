import { prisma } from '../../shared/prisma.client';

export class AuditLogsService {
  async findAll(filters?: { entityType?: string; limit?: number }) {
    return prisma.auditLog.findMany({
      where: {
        ...(filters?.entityType ? { entityType: filters.entityType } : {}),
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit ?? 50,
    });
  }

  async findByEntity(entityType: string, entityId: string) {
    return prisma.auditLog.findMany({
      where: { entityType, entityId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const auditLogsService = new AuditLogsService();
