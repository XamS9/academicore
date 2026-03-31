import { prisma } from "../../shared/prisma.client";
import { HttpError } from "../../shared/http-error";
import { notificationsService } from "../notifications/notifications.service";
import { EnrollStudentDto } from "./enrollments.dto";

export class EnrollmentsService {
  async enrollStudent(dto: EnrollStudentDto) {
    const result = await prisma.$queryRaw<
      Array<{ p_result_code: number; p_result_message: string }>
    >`
      SELECT p_result_code, p_result_message FROM sp_enroll_student(
        ${dto.studentId}::uuid,
        ${dto.groupId}::uuid,
        ${dto.periodId}::uuid
      )
    `;
    const { p_result_code, p_result_message } = result[0];
    if (p_result_code !== 0) {
      throw new HttpError(400, p_result_message);
    }

    // Notify student
    const student = await prisma.student.findUnique({
      where: { id: dto.studentId },
      select: { userId: true },
    });
    const group = await prisma.group.findUnique({
      where: { id: dto.groupId },
      include: { subject: true },
    });
    if (student && group) {
      await notificationsService.create({
        userId: student.userId,
        title: "Inscripción confirmada",
        message: `Te has inscrito exitosamente a ${group.subject.name} (${group.groupCode})`,
        type: "ENROLLMENT_CONFIRMED",
        relatedEntity: "group",
        relatedEntityId: dto.groupId,
      });
    }

    return { success: true, message: p_result_message };
  }

  async getStudentByUserId(userId: string) {
    return prisma.student.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true, careerId: true },
    });
  }

  /**
   * Returns groups available for self-enrollment:
   * active groups in the open enrollment period for the student's career,
   * excluding groups the student is already enrolled in.
   */
  async findAvailableGroups(userId: string) {
    const student = await prisma.student.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true, careerId: true },
    });
    if (!student) throw new HttpError(404, "Estudiante no encontrado");

    const activePeriod = await prisma.academicPeriod.findFirst({
      where: { isActive: true, enrollmentOpen: true },
    });
    if (!activePeriod) return [];

    // Get subject IDs in student's career
    const careerSubjects = await prisma.careerSubject.findMany({
      where: { careerId: student.careerId },
      select: { subjectId: true },
    });
    const careerSubjectIds = careerSubjects.map((cs) => cs.subjectId);

    // Get group IDs student is already enrolled in for this period
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: { studentId: student.id, academicPeriodId: activePeriod.id },
      select: {
        enrollmentSubjects: {
          where: { status: "ENROLLED" },
          select: { groupId: true },
        },
      },
    });
    const enrolledGroupIds =
      existingEnrollment?.enrollmentSubjects.map((es) => es.groupId) ?? [];

    return prisma.group.findMany({
      where: {
        academicPeriodId: activePeriod.id,
        isActive: true,
        subjectId: { in: careerSubjectIds },
        id: { notIn: enrolledGroupIds },
      },
      include: {
        subject: {
          select: { id: true, name: true, code: true, credits: true },
        },
        teacher: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });
  }

  async findByStudent(studentId: string) {
    return prisma.enrollment.findMany({
      where: { studentId },
      include: {
        academicPeriod: true,
        enrollmentSubjects: {
          include: {
            group: {
              include: { subject: true, teacher: { include: { user: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findByPeriod(periodId: string) {
    return prisma.enrollment.findMany({
      where: { academicPeriodId: periodId },
      include: {
        student: { include: { user: true } },
        enrollmentSubjects: true,
      },
    });
  }

  async dropSubject(enrollmentSubjectId: string) {
    const result = await prisma.$queryRaw<
      Array<{ p_result_code: number; p_result_message: string }>
    >`
      SELECT p_result_code, p_result_message FROM sp_drop_enrollment_subject(
        ${enrollmentSubjectId}::uuid
      )
    `;
    const { p_result_code, p_result_message } = result[0];
    if (p_result_code !== 0) {
      throw new HttpError(400, p_result_message);
    }
    return { success: true, message: p_result_message };
  }
}

export const enrollmentsService = new EnrollmentsService();
