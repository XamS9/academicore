import { prisma } from "../../shared/prisma.client";
import type { ReportQuery } from "./reports.dto";

export class ReportsService {
  async enrollmentStats(query: ReportQuery) {
    const periods = await prisma.academicPeriod.findMany({
      select: {
        id: true,
        name: true,
        enrollments: {
          select: {
            student: { select: { careerId: true } },
          },
        },
      },
      orderBy: { startDate: "asc" },
    });

    return periods.map((p) => {
      const byCareerId: Record<string, number> = {};
      p.enrollments.forEach((e) => {
        byCareerId[e.student.careerId] =
          (byCareerId[e.student.careerId] || 0) + 1;
      });
      return {
        periodId: p.id,
        periodName: p.name,
        total: p.enrollments.length,
        byCareer: byCareerId,
      };
    });
  }

  async passFail(query: ReportQuery) {
    const where: any = {};
    if (query.periodId) where.academicPeriodId = query.periodId;

    const records = await prisma.academicRecord.findMany({
      where,
      select: {
        passed: true,
        academicPeriod: { select: { id: true, name: true } },
      },
    });

    const byPeriod: Record<
      string,
      { periodName: string; passed: number; failed: number }
    > = {};
    records.forEach((r) => {
      const key = r.academicPeriod.id;
      if (!byPeriod[key]) {
        byPeriod[key] = {
          periodName: r.academicPeriod.name,
          passed: 0,
          failed: 0,
        };
      }
      if (r.passed) byPeriod[key].passed++;
      else byPeriod[key].failed++;
    });

    return Object.entries(byPeriod).map(([periodId, data]) => ({
      periodId,
      ...data,
    }));
  }

  async gpaTrends() {
    const periods = await prisma.academicPeriod.findMany({
      orderBy: { startDate: "asc" },
      select: {
        id: true,
        name: true,
        academicRecords: {
          select: { finalGrade: true },
        },
      },
    });

    return periods
      .filter((p) => p.academicRecords.length > 0)
      .map((p) => {
        const grades = p.academicRecords.map((r) => Number(r.finalGrade));
        const avg = grades.reduce((a, b) => a + b, 0) / grades.length;
        return {
          periodId: p.id,
          periodName: p.name,
          averageGpa: Math.round(avg * 100) / 100,
          studentCount: grades.length,
        };
      });
  }

  async atRisk() {
    const students = await prisma.student.findMany({
      where: { academicStatus: "AT_RISK", deletedAt: null },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        career: { select: { name: true, code: true } },
      },
    });

    return {
      count: students.length,
      students: students.map((s) => ({
        id: s.id,
        studentCode: s.studentCode,
        name: `${s.user.firstName} ${s.user.lastName}`,
        email: s.user.email,
        career: s.career.name,
      })),
    };
  }

  async summary() {
    const [
      students,
      teachers,
      activePeriods,
      enrollments,
      atRisk,
      pendingFees,
    ] = await Promise.all([
      prisma.student.count({ where: { deletedAt: null } }),
      prisma.teacher.count({ where: { deletedAt: null } }),
      prisma.academicPeriod.count({ where: { isActive: true } }),
      prisma.enrollment.count({ where: { status: "ACTIVE" } }),
      prisma.student.count({
        where: { academicStatus: "AT_RISK", deletedAt: null },
      }),
      prisma.studentFee.count({ where: { status: "PENDING" } }),
    ]);

    return {
      students,
      teachers,
      activePeriods,
      enrollments,
      atRisk,
      pendingFees,
    };
  }
}

export const reportsService = new ReportsService();
