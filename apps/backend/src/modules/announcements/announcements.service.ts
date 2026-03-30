import { prisma } from '../../shared/prisma.client';
import { HttpError } from '../../shared/http-error';
import { notificationsService } from '../notifications/notifications.service';
import type { CreateAnnouncementInput, UpdateAnnouncementInput } from './announcements.dto';

export class AnnouncementsService {
  async findAll() {
    return prisma.announcement.findMany({
      include: { author: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async findById(id: string) {
    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: { author: { select: { id: true, firstName: true, lastName: true } } },
    });
    if (!announcement) throw new HttpError(404, 'Anuncio no encontrado');
    return announcement;
  }

  /**
   * Returns announcements relevant to the calling user.
   * - ALL audience: everyone sees them
   * - CAREER: students in that career
   * - GROUP: students enrolled in that group
   * Teachers see ALL + their own authored announcements
   */
  async findMy(userId: string, userType: string) {
    if (userType === 'ADMIN') return this.findAll();

    if (userType === 'TEACHER') {
      return prisma.announcement.findMany({
        where: {
          OR: [
            { audience: 'ALL' },
            { authorId: userId },
          ],
        },
        include: { author: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { publishedAt: 'desc' },
      });
    }

    // STUDENT — resolve career and enrolled groups
    const student = await prisma.student.findFirst({
      where: { userId, deletedAt: null },
      select: {
        careerId: true,
        enrollments: {
          where: { status: 'ACTIVE' },
          select: {
            enrollmentSubjects: {
              where: { status: 'ENROLLED' },
              select: { groupId: true },
            },
          },
        },
      },
    });

    const careerId = student?.careerId;
    const groupIds = student?.enrollments.flatMap((e) =>
      e.enrollmentSubjects.map((es) => es.groupId),
    ) ?? [];

    return prisma.announcement.findMany({
      where: {
        OR: [
          { audience: 'ALL' },
          ...(careerId ? [{ audience: 'CAREER' as const, targetId: careerId }] : []),
          ...(groupIds.length > 0
            ? [{ audience: 'GROUP' as const, targetId: { in: groupIds } }]
            : []),
        ],
      },
      include: { author: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async create(authorId: string, data: CreateAnnouncementInput) {
    if (data.audience !== 'ALL' && !data.targetId) {
      throw new HttpError(400, 'targetId es requerido cuando la audiencia no es ALL');
    }

    const announcement = await prisma.announcement.create({
      data: { ...data, authorId },
      include: { author: { select: { id: true, firstName: true, lastName: true } } },
    });

    // Fan-out notifications
    const userIds = await this.resolveTargetUserIds(data.audience, data.targetId);
    if (userIds.length > 0) {
      await notificationsService.createBulk(userIds, {
        title: 'Nuevo anuncio',
        message: data.title,
        type: 'ANNOUNCEMENT',
        relatedEntity: 'announcement',
        relatedEntityId: announcement.id,
      });
    }

    return announcement;
  }

  async update(id: string, data: UpdateAnnouncementInput) {
    await this.findById(id);
    return prisma.announcement.update({
      where: { id },
      data,
      include: { author: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return prisma.announcement.delete({ where: { id } });
  }

  private async resolveTargetUserIds(audience: string, targetId?: string): Promise<string[]> {
    if (audience === 'ALL') {
      const students = await prisma.student.findMany({
        where: { deletedAt: null },
        select: { userId: true },
      });
      return students.map((s) => s.userId);
    }

    if (audience === 'CAREER' && targetId) {
      const students = await prisma.student.findMany({
        where: { careerId: targetId, deletedAt: null },
        select: { userId: true },
      });
      return students.map((s) => s.userId);
    }

    if (audience === 'GROUP' && targetId) {
      const enrollmentSubjects = await prisma.enrollmentSubject.findMany({
        where: { groupId: targetId, status: 'ENROLLED' },
        select: {
          enrollment: {
            select: { student: { select: { userId: true } } },
          },
        },
      });
      return enrollmentSubjects.map((es) => es.enrollment.student.userId);
    }

    return [];
  }
}

export const announcementsService = new AnnouncementsService();
