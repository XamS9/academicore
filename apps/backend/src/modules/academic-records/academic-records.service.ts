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
      include: { academicPeriod: true },
    });

    const byPeriod = new Map<string, { periodName: string; grades: number[] }>();
    for (const r of records) {
      const key = r.academicPeriodId;
      if (!byPeriod.has(key)) {
        byPeriod.set(key, { periodName: r.academicPeriod.name, grades: [] });
      }
      byPeriod.get(key)!.grades.push(Number(r.finalGrade));
    }

    return Array.from(byPeriod.entries()).map(([periodId, { periodName, grades }]) => ({
      periodId,
      periodName,
      average: grades.reduce((a, b) => a + b, 0) / grades.length,
      count: grades.length,
    }));
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
