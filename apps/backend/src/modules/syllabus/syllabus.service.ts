import { prisma } from "../../shared/prisma.client";
import { HttpError } from "../../shared/http-error";
import {
  CreateSyllabusTopicDto,
  UpdateSyllabusTopicDto,
  ReorderSyllabusTopicsDto,
  MarkTopicProgressDto,
} from "./syllabus.dto";

class SyllabusService {
  // ───── Subject-level topics (admin) ─────

  async listBySubject(subjectId: string) {
    return prisma.syllabusTopic.findMany({
      where: { subjectId },
      orderBy: { sortOrder: "asc" },
    });
  }

  async create(dto: CreateSyllabusTopicDto) {
    const subject = await prisma.subject.findFirst({
      where: { id: dto.subjectId, deletedAt: null },
    });
    if (!subject) throw new HttpError(404, "Materia no encontrada");

    let order = dto.sortOrder;
    if (order === undefined) {
      const last = await prisma.syllabusTopic.findFirst({
        where: { subjectId: dto.subjectId },
        orderBy: { sortOrder: "desc" },
      });
      order = last ? last.sortOrder + 1 : 0;
    }

    return prisma.syllabusTopic.create({
      data: {
        subjectId: dto.subjectId,
        title: dto.title,
        description: dto.description ?? null,
        sortOrder: order,
      },
    });
  }

  async update(id: string, dto: UpdateSyllabusTopicDto) {
    const existing = await prisma.syllabusTopic.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Tema no encontrado");
    return prisma.syllabusTopic.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
    });
  }

  async remove(id: string) {
    const existing = await prisma.syllabusTopic.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Tema no encontrado");
    await prisma.syllabusTopic.delete({ where: { id } });
  }

  async reorder(subjectId: string, dto: ReorderSyllabusTopicsDto) {
    const topics = await prisma.syllabusTopic.findMany({
      where: { subjectId },
      select: { id: true },
    });
    const known = new Set(topics.map((t) => t.id));
    for (const id of dto.orderedIds) {
      if (!known.has(id)) throw new HttpError(400, "Tema no pertenece a la materia");
    }

    // Two-phase to avoid unique (subjectId, sortOrder) conflicts
    const offset = 1_000_000;
    await prisma.$transaction([
      ...dto.orderedIds.map((id, idx) =>
        prisma.syllabusTopic.update({
          where: { id },
          data: { sortOrder: offset + idx },
        }),
      ),
      ...dto.orderedIds.map((id, idx) =>
        prisma.syllabusTopic.update({
          where: { id },
          data: { sortOrder: idx },
        }),
      ),
    ]);
  }

  // ───── Group progress (teacher + student read) ─────

  async getGroupProgress(groupId: string) {
    const group = await prisma.group.findFirst({
      where: { id: groupId },
      include: {
        subject: {
          include: {
            syllabusTopics: { orderBy: { sortOrder: "asc" } },
          },
        },
      },
    });
    if (!group) throw new HttpError(404, "Grupo no encontrado");

    const progress = await prisma.groupTopicProgress.findMany({
      where: { groupId },
    });
    const byTopicId = new Map(progress.map((p) => [p.topicId, p]));

    return group.subject.syllabusTopics.map((t) => ({
      id: t.id,
      subjectId: t.subjectId,
      sortOrder: t.sortOrder,
      title: t.title,
      description: t.description,
      progress: byTopicId.get(t.id) ?? null,
    }));
  }

  async markProgress(groupId: string, teacherUserId: string, dto: MarkTopicProgressDto) {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { teacher: true },
    });
    if (!group) throw new HttpError(404, "Grupo no encontrado");

    // Teacher must own the group (unless admin — service trusts controller authorize check)
    const teacher = await prisma.teacher.findFirst({
      where: { userId: teacherUserId, deletedAt: null },
    });
    if (!teacher) throw new HttpError(403, "No tienes un perfil de docente");
    if (group.teacherId !== teacher.id) {
      throw new HttpError(403, "No eres el docente de este grupo");
    }

    const topic = await prisma.syllabusTopic.findUnique({
      where: { id: dto.topicId },
    });
    if (!topic) throw new HttpError(404, "Tema no encontrado");
    if (topic.subjectId !== group.subjectId) {
      throw new HttpError(400, "El tema no pertenece a la materia del grupo");
    }

    const coveredAt = dto.coveredAt ? new Date(dto.coveredAt) : new Date();

    return prisma.groupTopicProgress.upsert({
      where: {
        groupId_topicId: { groupId, topicId: dto.topicId },
      },
      update: {
        weekNumber: dto.weekNumber,
        coveredAt,
        notes: dto.notes ?? null,
        teacherId: teacher.id,
      },
      create: {
        groupId,
        topicId: dto.topicId,
        teacherId: teacher.id,
        weekNumber: dto.weekNumber,
        coveredAt,
        notes: dto.notes ?? null,
      },
    });
  }

  async removeProgress(groupId: string, topicId: string, teacherUserId: string) {
    const teacher = await prisma.teacher.findFirst({
      where: { userId: teacherUserId, deletedAt: null },
    });
    if (!teacher) throw new HttpError(403, "No tienes un perfil de docente");

    const progress = await prisma.groupTopicProgress.findUnique({
      where: { groupId_topicId: { groupId, topicId } },
      include: { group: true },
    });
    if (!progress) throw new HttpError(404, "Progreso no encontrado");
    if (progress.group.teacherId !== teacher.id) {
      throw new HttpError(403, "No eres el docente de este grupo");
    }

    await prisma.groupTopicProgress.delete({
      where: { groupId_topicId: { groupId, topicId } },
    });
  }

  async getProgressForStudent(groupId: string, studentUserId: string) {
    const student = await prisma.student.findFirst({
      where: { userId: studentUserId, deletedAt: null },
    });
    if (!student) throw new HttpError(404, "Estudiante no encontrado");

    const enrolled = await prisma.enrollmentSubject.findFirst({
      where: {
        groupId,
        status: "ENROLLED",
        enrollment: { studentId: student.id },
      },
    });
    if (!enrolled) throw new HttpError(403, "No estás inscrito en este grupo");

    return this.getGroupProgress(groupId);
  }
}

export const syllabusService = new SyllabusService();
