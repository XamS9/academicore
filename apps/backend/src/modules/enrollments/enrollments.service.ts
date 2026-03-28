import { prisma } from '../../shared/prisma.client';
import { HttpError } from '../../shared/http-error';
import { EnrollStudentDto } from './enrollments.dto';

export class EnrollmentsService {
  async enrollStudent(dto: EnrollStudentDto) {
    const result = await prisma.$queryRaw<Array<{ p_result_code: number; p_result_message: string }>>`
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
    return { success: true, message: p_result_message };
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByPeriod(periodId: string) {
    return prisma.enrollment.findMany({
      where: { academicPeriodId: periodId },
      include: { student: { include: { user: true } }, enrollmentSubjects: true },
    });
  }

  async dropSubject(enrollmentSubjectId: string) {
    const result = await prisma.$queryRaw<Array<{ p_result_code: number; p_result_message: string }>>`
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
