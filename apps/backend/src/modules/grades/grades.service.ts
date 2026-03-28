import { prisma } from '../../shared/prisma.client';
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
    return prisma.$transaction(grades.map((dto) =>
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
  }
}

export const gradesService = new GradesService();
