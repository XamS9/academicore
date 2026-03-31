import { prisma } from "../../shared/prisma.client";
import { HttpError } from "../../shared/http-error";
import {
  CreateGroupDto,
  UpdateGroupDto,
  AssignClassroomDto,
} from "./groups.dto";

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

  async findByTeacher(teacherId: string) {
    return prisma.group.findMany({
      where: { teacherId },
      include: {
        subject: true,
        academicPeriod: true,
      },
    });
  }

  async create(dto: CreateGroupDto) {
    return prisma.group.create({
      data: dto,
    });
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
