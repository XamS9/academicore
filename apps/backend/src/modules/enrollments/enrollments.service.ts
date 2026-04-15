import { prisma } from "../../shared/prisma.client";
import { HttpError } from "../../shared/http-error";
import { notificationsService } from "../notifications/notifications.service";
import type { JwtPayload } from "../../middleware/auth.middleware";
import { getStudentIdForUser } from "../../shared/student-access";
import { EnrollStudentDto } from "./enrollments.dto";

type EnrollStudentInput = EnrollStudentDto & { studentId: string };

export class EnrollmentsService {
  async enrollStudent(dto: EnrollStudentInput) {
    // Validate period
    const period = await prisma.academicPeriod.findUnique({ where: { id: dto.periodId } });
    if (!period) throw new HttpError(400, "Período académico no encontrado");
    if (!period.enrollmentOpen) throw new HttpError(400, "El período no tiene inscripciones abiertas");

    // Validate student
    const student = await prisma.student.findFirst({ where: { id: dto.studentId, deletedAt: null } });
    if (!student) throw new HttpError(400, "Estudiante no encontrado");
    if (!["ACTIVE", "AT_RISK", "ELIGIBLE_FOR_GRADUATION"].includes(student.academicStatus)) {
      throw new HttpError(400, "El estudiante no está en un estado que permita inscripción");
    }

    // Validate group
    const group = await prisma.group.findFirst({
      where: { id: dto.groupId, isActive: true },
      include: { subject: true },
    });
    if (!group) throw new HttpError(400, "Grupo no encontrado o inactivo");
    if (group.currentStudents >= group.maxStudents) throw new HttpError(400, "El grupo no tiene cupos disponibles");

    // Validate prerequisites
    const prereqs = await prisma.subjectPrerequisite.findMany({ where: { subjectId: group.subjectId } });
    for (const prereq of prereqs) {
      const passed = await prisma.academicRecord.findFirst({
        where: {
          studentId: dto.studentId,
          passed: true,
          group: { subjectId: prereq.prerequisiteId },
        },
      });
      if (!passed) {
        // Allow co-requisite: student is concurrently enrolled in the prerequisite this period
        const enrolledInPrereq = await prisma.enrollmentSubject.findFirst({
          where: {
            status: "ENROLLED",
            enrollment: { studentId: dto.studentId, academicPeriodId: dto.periodId },
            group: { subjectId: prereq.prerequisiteId },
          },
        });
        if (!enrolledInPrereq) {
          throw new HttpError(400, "El estudiante no cumple con los prerrequisitos de la materia");
        }
      }
    }

    // Check already enrolled
    const alreadyEnrolled = await prisma.enrollmentSubject.findFirst({
      where: {
        groupId: dto.groupId,
        status: "ENROLLED",
        enrollment: { studentId: dto.studentId },
      },
    });
    if (alreadyEnrolled) throw new HttpError(400, "El estudiante ya está inscrito en este grupo");

    // Check max subjects per enrollment
    const settings = await prisma.systemSettings.findFirst();
    const maxSubjects = settings?.maxSubjectsPerEnrollment ?? 7;
    const currentCount = await prisma.enrollmentSubject.count({
      where: {
        status: "ENROLLED",
        enrollment: { studentId: dto.studentId, academicPeriodId: dto.periodId },
      },
    });
    if (currentCount >= maxSubjects) {
      throw new HttpError(400, `El estudiante ha alcanzado el máximo de materias por inscripción (${maxSubjects})`);
    }

    // Perform enrollment in a transaction
    await prisma.$transaction(async (tx) => {
      let enrollment = await tx.enrollment.findFirst({
        where: { studentId: dto.studentId, academicPeriodId: dto.periodId },
      });
      const isFirstEnrollment = !enrollment;
      if (!enrollment) {
        enrollment = await tx.enrollment.create({
          data: { studentId: dto.studentId, academicPeriodId: dto.periodId, status: "ACTIVE" },
        });
      }
      await tx.enrollmentSubject.create({
        data: { enrollmentId: enrollment.id, groupId: dto.groupId, status: "ENROLLED" },
      });
      await tx.group.update({
        where: { id: dto.groupId },
        data: { currentStudents: { increment: 1 } },
      });

      // Generate inscription fee on first enrollment for this period
      if (isFirstEnrollment) {
        const inscriptionConcept = await tx.feeConcept.findFirst({
          where: { isActive: true, name: { contains: "inscripci", mode: "insensitive" } },
        });
        if (inscriptionConcept) {
          const alreadyAssigned = await tx.studentFee.findFirst({
            where: { studentId: dto.studentId, feeConceptId: inscriptionConcept.id, periodId: dto.periodId },
          });
          if (!alreadyAssigned) {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 30);
            await tx.studentFee.create({
              data: {
                studentId: dto.studentId,
                feeConceptId: inscriptionConcept.id,
                periodId: dto.periodId,
                amount: inscriptionConcept.amount,
                dueDate,
              },
            });
          }
        }
      }
    });

    // Notify student
    await notificationsService.create({
      userId: student.userId,
      title: "Inscripción confirmada",
      message: `Te has inscrito exitosamente a ${group.subject.name} (${group.groupCode})`,
      type: "ENROLLMENT_CONFIRMED",
      relatedEntity: "group",
      relatedEntityId: dto.groupId,
    });

    return { success: true, message: "Inscripción exitosa" };
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

    // Fetch student's passed subject IDs from academic records
    const passedRecords = await prisma.academicRecord.findMany({
      where: { studentId: student.id, passed: true },
      include: { group: { select: { subjectId: true } } },
    });
    const passedSubjectIds = new Set(passedRecords.map((r) => r.group.subjectId));

    const groups = await prisma.group.findMany({
      where: {
        academicPeriodId: activePeriod.id,
        isActive: true,
        subjectId: { in: careerSubjectIds },
        id: { notIn: enrolledGroupIds },
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            credits: true,
            prerequisites: {
              include: {
                prerequisite: { select: { id: true, name: true, code: true } },
              },
            },
          },
        },
        teacher: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        groupClassrooms: {
          include: {
            classroom: { select: { name: true, building: true } },
          },
        },
      },
    });

    return groups.map((g) => {
      const prereqs = g.subject.prerequisites;
      const prerequisitesMet =
        prereqs.length === 0 ||
        prereqs.every((p) => passedSubjectIds.has(p.prerequisiteId));
      return {
        ...g,
        prerequisitesMet,
        subject: {
          ...g.subject,
          prerequisites: prereqs.map((p) => ({
            id: p.prerequisiteId,
            name: p.prerequisite.name,
            code: p.prerequisite.code,
            met: passedSubjectIds.has(p.prerequisiteId),
          })),
        },
      };
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

  /** Class schedule for active period enrollments (day, time, classroom, subject). */
  async getScheduleForStudent(studentId: string) {
    const rows = await prisma.enrollmentSubject.findMany({
      where: {
        status: "ENROLLED",
        enrollment: {
          studentId,
          academicPeriod: { isActive: true },
        },
      },
      include: {
        enrollment: {
          select: { academicPeriod: { select: { id: true, name: true } } },
        },
        group: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
            groupClassrooms: {
              include: {
                classroom: { select: { id: true, name: true, building: true } },
              },
            },
          },
        },
      },
    });

    const slots: Array<{
      enrollmentSubjectId: string;
      periodName: string;
      groupId: string;
      groupCode: string;
      subject: { id: string; name: string; code: string };
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      classroom: { id: string; name: string; building: string | null };
    }> = [];

    for (const es of rows) {
      const periodName = es.enrollment.academicPeriod.name;
      for (const gc of es.group.groupClassrooms) {
        slots.push({
          enrollmentSubjectId: es.id,
          periodName,
          groupId: es.groupId,
          groupCode: es.group.groupCode,
          subject: es.group.subject,
          dayOfWeek: gc.dayOfWeek,
          startTime: gc.startTime.toISOString().slice(11, 19),
          endTime: gc.endTime.toISOString().slice(11, 19),
          classroom: gc.classroom,
        });
      }
    }

    slots.sort((a, b) =>
      a.dayOfWeek !== b.dayOfWeek
        ? a.dayOfWeek - b.dayOfWeek
        : a.startTime.localeCompare(b.startTime),
    );
    return slots;
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

  /**
   * UI gating for students: inscription payment + enrollment window for active period.
   */
  async getStudentNavState(userId: string) {
    const student = await prisma.student.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true },
    });
    if (!student) {
      throw new HttpError(404, "Estudiante no encontrado");
    }

    const activePeriod = await prisma.academicPeriod.findFirst({
      where: { isActive: true },
      select: { id: true, enrollmentOpen: true },
    });

    if (!activePeriod) {
      return {
        activePeriodId: null as string | null,
        enrollmentOpen: false,
        pendingInscriptionPayment: false,
      };
    }

    const pendingInscription = await prisma.studentFee.findFirst({
      where: {
        studentId: student.id,
        periodId: activePeriod.id,
        status: { in: ["PENDING", "OVERDUE"] },
        feeConcept: {
          name: { contains: "inscripci", mode: "insensitive" },
        },
      },
      select: { id: true },
    });

    return {
      activePeriodId: activePeriod.id,
      enrollmentOpen: activePeriod.enrollmentOpen,
      pendingInscriptionPayment: !!pendingInscription,
    };
  }

  async dropSubject(enrollmentSubjectId: string, user: JwtPayload) {
    const es = await prisma.enrollmentSubject.findUnique({
      where: { id: enrollmentSubjectId },
      include: { enrollment: { include: { academicPeriod: true } } },
    });
    if (!es) throw new HttpError(400, "Inscripción a materia no encontrada");
    if (es.status !== "ENROLLED") throw new HttpError(400, "La materia no está en estado INSCRITO");

    if (user.userType === "STUDENT") {
      const studentId = await getStudentIdForUser(user.sub);
      if (!studentId || es.enrollment.studentId !== studentId) {
        throw new HttpError(403, "No puedes dar de baja una inscripción que no es tuya");
      }
    } else if (user.userType !== "ADMIN") {
      throw new HttpError(403, "No autorizado");
    }

    const period = es.enrollment.academicPeriod;
    if (!period.isActive) throw new HttpError(400, "El período académico no está activo");
    if (!period.enrollmentOpen) throw new HttpError(400, "El período de inscripción ya cerró. No es posible dar de baja materias.");
    if (period.endDate < new Date()) throw new HttpError(400, "El período académico ya finalizó");

    await prisma.$transaction(async (tx) => {
      await tx.enrollmentSubject.update({
        where: { id: enrollmentSubjectId },
        data: { status: "DROPPED" },
      });
      await tx.group.update({
        where: { id: es.groupId },
        data: { currentStudents: { decrement: 1 } },
      });
    });

    return { success: true, message: "Baja de materia exitosa" };
  }
}

export const enrollmentsService = new EnrollmentsService();
