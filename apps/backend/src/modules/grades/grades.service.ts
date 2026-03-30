import { prisma } from '../../shared/prisma.client';
import { notificationsService } from '../notifications/notifications.service';
import { UpsertGradeDto } from './grades.dto';

export class GradesService {
  async findByEvaluation(evaluationId: string) {
    return prisma.grade.findMany({
      where: { evaluationId },
      include: {
        student: {
          include: { user: true },
        },
      },
    });
  }

  async findByStudentAndGroup(studentId: string, groupId: string) {
    return prisma.grade.findMany({
      where: { studentId, evaluation: { groupId } },
      include: { evaluation: true },
    });
  }

  async upsert(dto: UpsertGradeDto, gradedBy: string) {
    return prisma.grade.upsert({
      where: {
        evaluationId_studentId: {
          evaluationId: dto.evaluationId,
          studentId: dto.studentId,
        },
      },
      create: { ...dto, gradedBy, gradedAt: new Date() },
      update: { score: dto.score, gradedBy, gradedAt: new Date(), updatedAt: new Date() },
    });
  }

  async bulkUpsert(grades: UpsertGradeDto[], gradedBy: string) {
    const results = await prisma.$transaction(grades.map((dto) =>
      prisma.grade.upsert({
        where: {
          evaluationId_studentId: {
            evaluationId: dto.evaluationId,
            studentId: dto.studentId,
          },
        },
        create: { ...dto, gradedBy, gradedAt: new Date() },
        update: { score: dto.score, gradedBy, gradedAt: new Date(), updatedAt: new Date() },
      }),
    ));

    // Notify students
    const studentIds = [...new Set(grades.map((g) => g.studentId))];
    const students = await prisma.student.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, userId: true },
    });
    const evaluation = grades[0]
      ? await prisma.evaluation.findUnique({ where: { id: grades[0].evaluationId }, include: { group: { include: { subject: true } } } })
      : null;
    if (evaluation) {
      await notificationsService.createBulk(
        students.map((s) => s.userId),
        {
          title: 'Calificación publicada',
          message: `Se ha publicado tu calificación de ${evaluation.name} en ${evaluation.group.subject.name}`,
          type: 'GRADE_POSTED',
          relatedEntity: 'evaluation',
          relatedEntityId: evaluation.id,
        },
      );
    }

    return results;
  }
}

export const gradesService = new GradesService();
