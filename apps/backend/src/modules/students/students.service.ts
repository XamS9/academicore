import { prisma } from "../../shared/prisma.client";
import { HttpError } from "../../shared/http-error";
import { CreateStudentDto, UpdateStudentDto } from "./students.dto";
import { enrollmentsService } from "../enrollments/enrollments.service";
import { subjectPrerequisitesSelect } from "../../shared/subject-with-prerequisites";

class StudentsService {
  private readonly include = {
    user: { select: { id: true, firstName: true, lastName: true, email: true, isActive: true } },
    career: { select: { id: true, name: true } },
  } as const;

  async findAll() {
    return prisma.student.findMany({
      where: { deletedAt: null },
      include: this.include,
    });
  }

  async findById(id: string) {
    const student = await prisma.student.findFirst({
      where: { id, deletedAt: null },
      include: this.include,
    });
    if (!student) throw new HttpError(404, "Student not found");
    return student;
  }

  async findByUserId(userId: string) {
    const student = await prisma.student.findFirst({
      where: { userId, deletedAt: null },
      include: this.include,
    });
    if (!student) throw new HttpError(404, "Student not found");
    return student;
  }

  /**
   * Single payload for student dashboard: profile, enrollments, fees summary,
   * recent records, certifications, recent grades, and class schedule.
   */
  async getOverviewByUserId(userId: string) {
    const student = await this.findByUserId(userId);
    const studentId = student.id;

    const [
      enrollments,
      fees,
      academicRecords,
      certifications,
      recentGrades,
      schedule,
    ] = await Promise.all([
      prisma.enrollment.findMany({
        where: { studentId },
        include: {
          academicPeriod: true,
          enrollmentSubjects: {
            where: { status: "ENROLLED" },
            include: {
              group: {
                include: {
                  subject: {
                    select: {
                      id: true,
                      name: true,
                      code: true,
                      ...subjectPrerequisitesSelect,
                    },
                  },
                  teacher: {
                    include: {
                      user: { select: { firstName: true, lastName: true } },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.studentFee.findMany({
        where: { studentId },
        include: {
          feeConcept: { select: { id: true, name: true } },
          period: { select: { id: true, name: true } },
        },
        orderBy: { dueDate: "asc" },
        take: 40,
      }),
      prisma.academicRecord.findMany({
        where: { studentId },
        orderBy: { generatedAt: "desc" },
        take: 15,
        include: {
          academicPeriod: { select: { id: true, name: true } },
          group: {
            include: { subject: { select: { id: true, name: true, code: true } } },
          },
        },
      }),
      prisma.certification.findMany({
        where: { studentId },
        orderBy: { issuedAt: "desc" },
        take: 20,
        include: {
          career: { select: { name: true } },
          issuer: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.grade.findMany({
        where: { studentId },
        orderBy: { updatedAt: "desc" },
        take: 25,
        include: {
          evaluation: {
            include: {
              group: {
                include: {
                  subject: {
                    select: {
                      name: true,
                      code: true,
                      ...subjectPrerequisitesSelect,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      enrollmentsService.getScheduleForStudent(studentId),
    ]);

    const pendingFees = fees.filter((f) => f.status === "PENDING");
    const feesSummary = {
      pendingCount: pendingFees.length,
      pendingTotal: pendingFees.reduce((s, f) => s + Number(f.amount), 0),
      overdueCount: pendingFees.filter((f) => new Date(f.dueDate) < new Date()).length,
    };

    return {
      student,
      enrollments,
      fees: fees.map((f) => ({
        ...f,
        amount: Number(f.amount),
      })),
      feesSummary,
      academicRecords,
      certifications,
      recentGrades,
      schedule,
    };
  }

  async create(dto: CreateStudentDto) {
    return prisma.student.create({
      data: {
        userId: dto.userId,
        studentCode: dto.studentCode,
        careerId: dto.careerId,
        ...(dto.enrollmentDate
          ? { enrollmentDate: new Date(dto.enrollmentDate) }
          : {}),
      },
    });
  }

  async update(id: string, dto: UpdateStudentDto) {
    await this.findById(id);
    return prisma.student.update({
      where: { id },
      data: dto,
    });
  }

  async approve(id: string) {
    const student = await this.findById(id);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: student.userId },
        data: { isActive: true },
      });
      await tx.student.update({
        where: { id },
        data: { academicStatus: "ACTIVE" },
      });

      // Ensure the STUDENT role exists and is assigned
      const studentRole = await tx.role.upsert({
        where: { name: "STUDENT" },
        update: {},
        create: { name: "STUDENT", description: "Student role" },
      });
      await tx.userRole.upsert({
        where: { userId_roleId: { userId: student.userId, roleId: studentRole.id } },
        update: {},
        create: { userId: student.userId, roleId: studentRole.id },
      });

    });

    return this.findById(id);
  }

  async softDelete(id: string) {
    await this.findById(id);
    return prisma.student.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export const studentsService = new StudentsService();
