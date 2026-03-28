import { prisma } from '../../shared/prisma.client';

export class AcademicRecordsService {
  async findByStudent(studentId: string) {
    return prisma.academicRecord.findMany({
      where: { studentId },
      include: {
        group: {
          include: {
            subject: true,
            academicPeriod: true,
          },
        },
        academicPeriod: true,
      },
      orderBy: { generatedAt: 'desc' },
    });
  }

  async findByStudentAndPeriod(studentId: string, periodId: string) {
    return prisma.academicRecord.findMany({
      where: { studentId, academicPeriodId: periodId },
      include: {
        group: {
          include: {
            subject: true,
            academicPeriod: true,
          },
        },
        academicPeriod: true,
      },
      orderBy: { generatedAt: 'desc' },
    });
  }

  async getStudentAverageByPeriod(studentId: string) {
    const records = await prisma.academicRecord.findMany({
      where: { studentId },
      include: {
        academicPeriod: true,
        group: { include: { subject: { select: { credits: true } } } },
      },
    });

    const byPeriod = new Map<string, { periodName: string; entries: Array<{ grade: number; credits: number }> }>();
    for (const r of records) {
      const key = r.academicPeriodId;
      if (!byPeriod.has(key)) {
        byPeriod.set(key, { periodName: r.academicPeriod.name, entries: [] });
      }
      byPeriod.get(key)!.entries.push({
        grade: Number(r.finalGrade),
        credits: r.group.subject.credits,
      });
    }

    return Array.from(byPeriod.entries()).map(([periodId, { periodName, entries }]) => {
      const totalCredits = entries.reduce((sum, e) => sum + e.credits, 0);
      const weightedSum = entries.reduce((sum, e) => sum + e.grade * e.credits, 0);
      return {
        periodId,
        periodName,
        average: totalCredits > 0 ? weightedSum / totalCredits : 0,
        totalCredits,
        count: entries.length,
      };
    });
  }

  async getPassedSubjects(studentId: string) {
    return prisma.academicRecord.findMany({
      where: { studentId, passed: true },
      include: {
        group: {
          include: {
            subject: true,
            academicPeriod: true,
          },
        },
        academicPeriod: true,
      },
      orderBy: { generatedAt: 'desc' },
    });
  }

  async getFailedSubjects(studentId: string) {
    return prisma.academicRecord.findMany({
      where: { studentId, passed: false },
      include: {
        group: {
          include: {
            subject: true,
            academicPeriod: true,
          },
        },
        academicPeriod: true,
      },
      orderBy: { generatedAt: 'desc' },
    });
  }
}

export const academicRecordsService = new AcademicRecordsService();
