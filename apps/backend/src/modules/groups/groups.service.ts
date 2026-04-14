import { prisma } from "../../shared/prisma.client";
import { HttpError } from "../../shared/http-error";
import {
  CreateGroupDto,
  UpdateGroupDto,
  AssignClassroomDto,
} from "./groups.dto";
import { allocateNextGroupCode } from "./group-code.util";

class GroupsService {
  async findAll(periodId?: string) {
    return prisma.group.findMany({
      where: periodId ? { academicPeriodId: periodId } : undefined,
      include: {
        subject: true,
        teacher: { include: { user: true } },
        academicPeriod: true,
      },
    });
  }

  async findById(id: string) {
    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        subject: true,
        teacher: { include: { user: true } },
        academicPeriod: true,
        groupClassrooms: { include: { classroom: true } },
      },
    });
    if (!group) throw new HttpError(404, "Group not found");
    return group;
  }

  async previewGroupCode(subjectId: string, academicPeriodId: string) {
    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, deletedAt: null },
    });
    if (!subject) throw new HttpError(404, "Materia no encontrada");
    const code = await allocateNextGroupCode(
      subjectId,
      academicPeriodId,
      subject,
    );
    return { code };
  }

  async findByTeacher(teacherId: string) {
    return prisma.group.findMany({
      where: { teacherId },
      include: {
        subject: true,
        academicPeriod: true,
      },
    });
  }

  async findStudentsByGroup(groupId: string) {
    const subjects = await prisma.enrollmentSubject.findMany({
      where: { groupId, status: "ENROLLED" },
      include: {
        enrollment: {
          include: {
            student: {
              include: { user: { select: { firstName: true, lastName: true } } },
            },
          },
        },
      },
    });
    return subjects.map((es) => ({
      studentId: es.enrollment.student.id,
      studentCode: es.enrollment.student.studentCode,
      firstName: es.enrollment.student.user.firstName,
      lastName: es.enrollment.student.user.lastName,
    }));
  }

  async create(dto: CreateGroupDto) {
    const subject = await prisma.subject.findFirst({
      where: { id: dto.subjectId, deletedAt: null },
    });
    if (!subject) throw new HttpError(404, "Materia no encontrada");

    const rawCode = dto.groupCode?.trim();
    let groupCode: string;
    if (rawCode && rawCode.length > 0) {
      groupCode = rawCode;
    } else {
      try {
        groupCode = await allocateNextGroupCode(
          dto.subjectId,
          dto.academicPeriodId,
          subject,
        );
      } catch {
        throw new HttpError(500, "No se pudo generar el código del grupo");
      }
    }

    const deliveryMode = dto.deliveryMode ?? "ON_SITE";

    const newGroup = await prisma.group.create({
      data: {
        subjectId: dto.subjectId,
        academicPeriodId: dto.academicPeriodId,
        teacherId: dto.teacherId,
        groupCode,
        maxStudents: dto.maxStudents,
        deliveryMode,
      },
    });

    // Auto-clone content from the most recent previous group for the same subject
    const previousGroup = await prisma.group.findFirst({
      where: {
        subjectId: dto.subjectId,
        id: { not: newGroup.id },
      },
      include: {
        topics: {
          include: { contentItems: { orderBy: { sortOrder: "asc" } } },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (previousGroup && previousGroup.topics.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const topic of previousGroup.topics) {
          const newTopic = await tx.topic.create({
            data: {
              groupId: newGroup.id,
              title: topic.title,
              description: topic.description,
              sortOrder: topic.sortOrder,
              weekNumber: topic.weekNumber,
            },
          });
          for (const item of topic.contentItems) {
            await tx.contentItem.create({
              data: {
                topicId: newTopic.id,
                title: item.title,
                type: item.type,
                content: item.content,
                sortOrder: item.sortOrder,
              },
            });
          }
        }
      });
    }

    return newGroup;
  }

  async update(id: string, dto: UpdateGroupDto) {
    await this.findById(id);
    return prisma.group.update({
      where: { id },
      data: dto,
    });
  }

  async toggleActive(id: string) {
    const group = await this.findById(id);
    return prisma.group.update({
      where: { id },
      data: { isActive: !group.isActive },
    });
  }

  async assignClassroom(groupId: string, dto: AssignClassroomDto) {
    const group = await this.findById(groupId);
    const startTimeParts = dto.startTime.split(":");
    const endTimeParts = dto.endTime.split(":");
    const startTime = new Date(
      1970,
      0,
      1,
      parseInt(startTimeParts[0]),
      parseInt(startTimeParts[1]),
    );
    const endTime = new Date(
      1970,
      0,
      1,
      parseInt(endTimeParts[0]),
      parseInt(endTimeParts[1]),
    );

    // Check classroom time overlap
    const existingSlots = await prisma.groupClassroom.findMany({
      where: {
        classroomId: dto.classroomId,
        dayOfWeek: dto.dayOfWeek,
      },
    });

    const hasClassroomOverlap = existingSlots.some((slot) => {
      return startTime < slot.endTime && endTime > slot.startTime;
    });

    if (hasClassroomOverlap) {
      throw new HttpError(
        409,
        "El aula ya tiene una clase programada que se traslapa con el horario solicitado",
      );
    }

    // Check teacher schedule conflict
    const teacherGroups = await prisma.group.findMany({
      where: {
        teacherId: group.teacherId,
        id: { not: groupId },
      },
      select: { id: true },
    });

    if (teacherGroups.length > 0) {
      const teacherSlots = await prisma.groupClassroom.findMany({
        where: {
          groupId: { in: teacherGroups.map((g) => g.id) },
          dayOfWeek: dto.dayOfWeek,
        },
      });

      const hasTeacherConflict = teacherSlots.some((slot) => {
        return startTime < slot.endTime && endTime > slot.startTime;
      });

      if (hasTeacherConflict) {
        throw new HttpError(
          409,
          "El profesor ya tiene una clase programada que se traslapa con el horario solicitado",
        );
      }
    }

    return prisma.groupClassroom.create({
      data: {
        groupId,
        classroomId: dto.classroomId,
        dayOfWeek: dto.dayOfWeek,
        startTime,
        endTime,
      },
    });
  }
}

export const groupsService = new GroupsService();
