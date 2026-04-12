import { prisma } from "../../shared/prisma.client";
import { notificationsService } from "../notifications/notifications.service";
import { certificationsService } from "../certifications/certifications.service";
import { UpsertGradeDto } from "./grades.dto";

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
      update: {
        score: dto.score,
        gradedBy,
        gradedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async bulkUpsert(grades: UpsertGradeDto[], gradedBy: string) {
    const results = await prisma.$transaction(
      grades.map((dto) =>
        prisma.grade.upsert({
          where: {
            evaluationId_studentId: {
              evaluationId: dto.evaluationId,
              studentId: dto.studentId,
            },
          },
          create: { ...dto, gradedBy, gradedAt: new Date() },
          update: {
            score: dto.score,
            gradedBy,
            gradedAt: new Date(),
            updatedAt: new Date(),
          },
        }),
      ),
    );

    // Notify students
    const studentIds = [...new Set(grades.map((g) => g.studentId))];
    const students = await prisma.student.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, userId: true },
    });
    const evaluation = grades[0]
      ? await prisma.evaluation.findUnique({
          where: { id: grades[0].evaluationId },
          include: { group: { include: { subject: true } } },
        })
      : null;
    if (evaluation) {
      await notificationsService.createBulk(
        students.map((s) => s.userId),
        {
          title: "Calificación publicada",
          message: `Se ha publicado tu calificación de ${evaluation.name} en ${evaluation.group.subject.name}`,
          type: "GRADE_POSTED",
          relatedEntity: "evaluation",
          relatedEntityId: evaluation.id,
        },
      );
    }

    await this.checkAndAutoIssueCertifications(studentIds, gradedBy);

    return results;
  }

  private async checkAndAutoIssueCertifications(
    studentIds: string[],
    issuedBy: string,
  ) {
    for (const studentId of studentIds) {
      try {
        const student = await prisma.student.findUnique({
          where: { id: studentId },
          select: { id: true, careerId: true, userId: true },
        });
        if (!student) continue;

        const mandatorySubjects = await prisma.careerSubject.findMany({
          where: { careerId: student.careerId, isMandatory: true },
          select: { subjectId: true },
        });
        if (mandatorySubjects.length === 0) continue;

        const passedRecords = await prisma.academicRecord.findMany({
          where: { studentId, passed: true },
          include: { group: { select: { subjectId: true } } },
        });
        const passedSubjectIds = new Set(
          passedRecords.map((r) => r.group.subjectId),
        );

        const allPassed = mandatorySubjects.every((ms) =>
          passedSubjectIds.has(ms.subjectId),
        );
        if (!allPassed) continue;

        const existing = await prisma.certification.findFirst({
          where: {
            studentId,
            careerId: student.careerId,
            certificationType: "COMPLETION",
            status: "ACTIVE",
          },
        });
        if (existing) continue;

        await certificationsService.issue(
          {
            studentId,
            careerId: student.careerId,
            certificationType: "COMPLETION",
          },
          issuedBy,
        );
      } catch {
        // Non-fatal: don't block grade saving if auto-cert fails
      }
    }
  }
}

export const gradesService = new GradesService();
