import { NotificationType } from "@prisma/client";
import { prisma } from "../../shared/prisma.client";
import type { NotificationQuery } from "./notifications.dto";

export class NotificationsService {
  async findByUser(userId: string, query: NotificationQuery = {}) {
    const { unreadOnly, limit = 20, offset = 0 } = query;
    return prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });
  }

  async unreadCount(userId: string) {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  /** Create a single notification — used by other modules */
  async create(data: {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    relatedEntity?: string;
    relatedEntityId?: string;
  }) {
    return prisma.notification.create({ data });
  }

  /** Create notifications for multiple users at once */
  async createBulk(
    userIds: string[],
    data: {
      title: string;
      message: string;
      type: NotificationType;
      relatedEntity?: string;
      relatedEntityId?: string;
    },
  ) {
    if (userIds.length === 0) return;
    return prisma.notification.createMany({
      data: userIds.map((userId) => ({ userId, ...data })),
      skipDuplicates: true,
    });
  }
}

export const notificationsService = new NotificationsService();
