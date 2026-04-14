import type { Prisma } from "@prisma/client";
import { prisma } from "../../shared/prisma.client";
import { HttpError } from "../../shared/http-error";
import { notificationsService } from "../notifications/notifications.service";
import type {
  AnnouncementListQuery,
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
} from "./announcements.dto";

const authorInclude = {
  author: { select: { id: true, firstName: true, lastName: true } },
} as const;

export class AnnouncementsService {
  private async findManyPaginated(
    where: Prisma.AnnouncementWhereInput | undefined,
    q: AnnouncementListQuery,
  ) {
    const skip = (q.page - 1) * q.pageSize;
    const [data, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        include: authorInclude,
        orderBy: { publishedAt: "desc" },
        skip,
        take: q.pageSize,
      }),
      prisma.announcement.count({ where }),
    ]);
    return { data, total, page: q.page, pageSize: q.pageSize };
  }

  async findAll(q: AnnouncementListQuery) {
    return this.findManyPaginated(undefined, q);
  }

  async findById(id: string) {
    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: authorInclude,
    });
    if (!announcement) throw new HttpError(404, "Anuncio no encontrado");
    return announcement;
  }

  /**
   * Returns announcements relevant to the calling user (paginated).
   * - ALL audience: everyone sees them
   * - CAREER: students in that career
   * - GROUP: students enrolled in that group
   * Teachers see ALL + their own authored announcements
   * Admins use the same dataset as `findAll`
   */
  async findMy(
    userId: string,
    userType: string,
    q: AnnouncementListQuery,
  ) {
    if (userType === "ADMIN") {
      return this.findAll(q);
    }

    if (userType === "TEACHER") {
      return this.findManyPaginated(
        { OR: [{ audience: "ALL" }, { authorId: userId }] },
        q,
      );
    }

    const student = await prisma.student.findFirst({
      where: { userId, deletedAt: null },
      select: {
        careerId: true,
        enrollments: {
          where: { status: "ACTIVE" },
          select: {
            enrollmentSubjects: {
              where: { status: "ENROLLED" },
              select: { groupId: true },
            },
          },
        },
      },
    });

    const careerId = student?.careerId;
    const groupIds =
      student?.enrollments.flatMap((e) =>
        e.enrollmentSubjects.map((es) => es.groupId),
      ) ?? [];

    const orConditions: Prisma.AnnouncementWhereInput[] = [
      { audience: "ALL" },
    ];
    if (careerId) {
      orConditions.push({ audience: "CAREER", targetId: careerId });
    }
    if (groupIds.length > 0) {
      orConditions.push({
        audience: "GROUP",
        targetId: { in: groupIds },
      });
    }

    return this.findManyPaginated({ OR: orConditions }, q);
  }

  async create(authorId: string, data: CreateAnnouncementInput) {
    if (data.audience !== "ALL" && !data.targetId) {
      throw new HttpError(
        400,
        "targetId es requerido cuando la audiencia no es ALL",
      );
    }

    const announcement = await prisma.announcement.create({
      data: { ...data, authorId },
      include: authorInclude,
    });

    const userIds = await this.resolveTargetUserIds(
      data.audience,
      data.targetId,
    );
    if (userIds.length > 0) {
      await notificationsService.createBulk(userIds, {
        title: "Nuevo anuncio",
        message: data.title,
        type: "ANNOUNCEMENT",
        relatedEntity: "announcement",
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
      include: authorInclude,
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return prisma.announcement.delete({ where: { id } });
  }

  private async resolveTargetUserIds(
    audience: string,
    targetId?: string,
  ): Promise<string[]> {
    if (audience === "ALL") {
      const students = await prisma.student.findMany({
        where: { deletedAt: null },
        select: { userId: true },
      });
      return students.map((s) => s.userId);
    }

    if (audience === "CAREER" && targetId) {
      const students = await prisma.student.findMany({
        where: { careerId: targetId, deletedAt: null },
        select: { userId: true },
      });
      return students.map((s) => s.userId);
    }

    if (audience === "GROUP" && targetId) {
      const enrollmentSubjects = await prisma.enrollmentSubject.findMany({
        where: { groupId: targetId, status: "ENROLLED" },
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
