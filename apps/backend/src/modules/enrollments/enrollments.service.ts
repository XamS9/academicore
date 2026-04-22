import { prisma } from "../../shared/prisma.client";
import { HttpError } from "../../shared/http-error";
import { notificationsService } from "../notifications/notifications.service";
import type { JwtPayload } from "../../middleware/auth.middleware";
import { getStudentIdForUser } from "../../shared/student-access";
import { syncMonthlyTuitionInstallmentsGlobal } from "../../shared/monthly-tuition";
import {
  creditBasedTuitionForSubject,
  tuitionForSubject,
} from "../../shared/academic-pricing";
import { CreateTuitionRequestDto, EnrollStudentDto } from "./enrollments.dto";
import {
  subjectPrerequisitesSelect,
  subjectWithPrerequisiteSubjectsInclude,
} from "../../shared/subject-with-prerequisites";
import {
  effectiveEnrollmentOpen,
  syncEnrollmentPhaseAutoClose,
} from "../../shared/enrollment-phase";

type EnrollStudentInput = EnrollStudentDto & { studentId: string };

export class EnrollmentsService {
  async enrollStudent(dto: EnrollStudentInput) {
    await syncEnrollmentPhaseAutoClose(prisma);
    // Validate period
    const period = await prisma.academicPeriod.findUnique({ where: { id: dto.periodId } });
    if (!period) throw new HttpError(400, "Período académico no encontrado");
    if (!effectiveEnrollmentOpen(period)) {
      throw new HttpError(400, "El período no tiene inscripciones abiertas");
    }

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

      // Generate inscription fee on first enrollment for this period (amount from system_settings.inscription_fee)
      const txSettings = await tx.systemSettings.findFirst();
      const inscriptionAmount = Number(txSettings?.inscriptionFee ?? 0);
      if (isFirstEnrollment && inscriptionAmount > 0) {
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
                amount: inscriptionAmount,
                dueDate,
              },
            });
          }
        }
      }
    });

    await syncMonthlyTuitionInstallmentsGlobal(dto.studentId, dto.periodId);

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

    await syncEnrollmentPhaseAutoClose(prisma);
    const openCandidates = await prisma.academicPeriod.findMany({
      where: { isActive: true, enrollmentOpen: true, status: "OPEN" },
    });
    const activePeriod =
      openCandidates.find((p) => effectiveEnrollmentOpen(p)) ?? null;
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

    const settings = await prisma.systemSettings.findFirst();
    const creditCost = Number(settings?.creditCost ?? 0);

    return groups.map((g) => {
      const prereqs = g.subject.prerequisites;
      const prerequisitesMet =
        prereqs.length === 0 ||
        prereqs.every((p) => passedSubjectIds.has(p.prerequisiteId));
      const computedTuition = creditBasedTuitionForSubject(g.subject, creditCost);
      return {
        ...g,
        prerequisitesMet,
        computedTuition,
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

  /**
   * Tras cerrar inscripciones: grupos activos con menos estudiantes que el mínimo configurado.
   * El estudiante puede solicitar tutoría (1:1) para cubrir la materia cuando el grupo no «abre».
   */
  async findTuitionRequestOptions(userId: string) {
    const student = await prisma.student.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true, careerId: true },
    });
    if (!student) throw new HttpError(404, "Estudiante no encontrado");

    const settings = await prisma.systemSettings.findFirst();
    const minStudents = settings?.minStudentsToOpenGroup ?? 0;
    if (minStudents <= 0) return [];

    await syncEnrollmentPhaseAutoClose(prisma);
    const activePeriod = await prisma.academicPeriod.findFirst({
      where: { isActive: true, status: "OPEN" },
    });
    if (!activePeriod || effectiveEnrollmentOpen(activePeriod)) return [];

    const careerSubjects = await prisma.careerSubject.findMany({
      where: { careerId: student.careerId },
      select: { subjectId: true },
    });
    const careerSubjectIds = careerSubjects.map((cs) => cs.subjectId);

    const enrolledRows = await prisma.enrollmentSubject.findMany({
      where: {
        status: "ENROLLED",
        enrollment: { studentId: student.id, academicPeriodId: activePeriod.id },
      },
      select: { groupId: true, group: { select: { subjectId: true } } },
    });
    const enrolledSubjectIds = new Set(enrolledRows.map((r) => r.group.subjectId));

    const pendingReqs = await prisma.tuitionGroupRequest.findMany({
      where: {
        studentId: student.id,
        academicPeriodId: activePeriod.id,
        status: "PENDING",
      },
      select: { subjectId: true },
    });
    const pendingSubjectIds = new Set(pendingReqs.map((r) => r.subjectId));

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
        currentStudents: { lt: minStudents },
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            credits: true,
            tuitionAmount: true,
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

    const creditCost = Number(settings?.creditCost ?? 0);

    const includeGroup = (g: (typeof groups)[number]) => {
      if (pendingSubjectIds.has(g.subjectId)) return false;
      if (!enrolledSubjectIds.has(g.subjectId)) return true;
      return enrolledRows.some((r) => r.groupId === g.id);
    };

    const mapped = groups.filter(includeGroup).map((g) => {
      const isMyEnrolledGroup = enrolledRows.some((r) => r.groupId === g.id);
      const prereqs = g.subject.prerequisites;
      const prerequisitesMet =
        prereqs.length === 0 ||
        prereqs.every((p) => passedSubjectIds.has(p.prerequisiteId));
      const computedTuition = tuitionForSubject(g.subject, creditCost);
      return {
        ...g,
        minStudentsRequired: minStudents,
        prerequisitesMet,
        computedTuition,
        isMyEnrolledGroup,
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

    return mapped;
  }

  async createTuitionRequest(userId: string, dto: CreateTuitionRequestDto) {
    const student = await prisma.student.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true, careerId: true, academicStatus: true },
    });
    if (!student) throw new HttpError(404, "Estudiante no encontrado");
    if (!["ACTIVE", "AT_RISK", "ELIGIBLE_FOR_GRADUATION"].includes(student.academicStatus)) {
      throw new HttpError(400, "Tu estado académico no permite esta solicitud");
    }

    const settings = await prisma.systemSettings.findFirst();
    const minStudents = settings?.minStudentsToOpenGroup ?? 0;
    if (minStudents <= 0) {
      throw new HttpError(400, "La solicitud de tutoría no está habilitada (mínimo de grupo en 0)");
    }

    await syncEnrollmentPhaseAutoClose(prisma);
    const period = await prisma.academicPeriod.findFirst({
      where: { isActive: true, status: "OPEN" },
    });
    if (!period || effectiveEnrollmentOpen(period)) {
      throw new HttpError(
        400,
        "Solo puedes solicitar tutoría cuando la inscripción al período activo está cerrada",
      );
    }

    const inCareer = await prisma.careerSubject.findFirst({
      where: { careerId: student.careerId, subjectId: dto.subjectId },
    });
    if (!inCareer) throw new HttpError(400, "La materia no pertenece a tu carrera");

    const group = await prisma.group.findFirst({
      where: {
        id: dto.groupId,
        academicPeriodId: period.id,
        subjectId: dto.subjectId,
        isActive: true,
      },
      include: { subject: { include: { prerequisites: true } } },
    });
    if (!group) throw new HttpError(400, "Grupo no válido para esta materia y período");

    if (group.currentStudents >= minStudents) {
      throw new HttpError(400, "Este grupo alcanzó el mínimo de estudiantes; ya no aplica solicitud de tutoría");
    }

    const enrollmentOnSubject = await prisma.enrollmentSubject.findFirst({
      where: {
        status: "ENROLLED",
        enrollment: { studentId: student.id, academicPeriodId: period.id },
        group: { subjectId: dto.subjectId },
      },
      select: { groupId: true },
    });
    if (enrollmentOnSubject && enrollmentOnSubject.groupId !== dto.groupId) {
      throw new HttpError(
        400,
        "Ya estás inscrito en otra sección de esta materia en este período",
      );
    }

    const pending = await prisma.tuitionGroupRequest.findFirst({
      where: {
        studentId: student.id,
        academicPeriodId: period.id,
        subjectId: dto.subjectId,
        status: "PENDING",
      },
    });
    if (pending) throw new HttpError(400, "Ya tienes una solicitud pendiente para esta materia");

    for (const p of group.subject.prerequisites) {
      const passed = await prisma.academicRecord.findFirst({
        where: {
          studentId: student.id,
          passed: true,
          group: { subjectId: p.prerequisiteId },
        },
      });
      if (!passed) {
        const concurrent = await prisma.enrollmentSubject.findFirst({
          where: {
            status: "ENROLLED",
            enrollment: { studentId: student.id, academicPeriodId: period.id },
            group: { subjectId: p.prerequisiteId },
          },
        });
        if (!concurrent) {
          throw new HttpError(400, "No cumples los prerrequisitos de la materia");
        }
      }
    }

    const created = await prisma.tuitionGroupRequest.create({
      data: {
        studentId: student.id,
        academicPeriodId: period.id,
        subjectId: dto.subjectId,
        groupId: dto.groupId,
        studentNote: dto.studentNote?.trim() || null,
      },
      include: {
        subject: { select: { name: true, code: true } },
        group: { select: { groupCode: true } },
      },
    });

    await syncMonthlyTuitionInstallmentsGlobal(student.id, period.id);

    return created;
  }

  async listTuitionRequestsForAdmin() {
    return prisma.tuitionGroupRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        subject: { select: { name: true, code: true } },
        group: { select: { groupCode: true } },
        academicPeriod: { select: { name: true } },
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
              include: {
                subject: { include: subjectWithPrerequisiteSubjectsInclude },
                teacher: { include: { user: true } },
              },
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
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
                ...subjectPrerequisitesSelect,
              },
            },
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
      subject: {
        id: string;
        name: string;
        code: string;
        prerequisites: Array<{
          prerequisite: { id: string; code: string; name: string };
        }>;
      };
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

    const settingsRow = await prisma.systemSettings.findFirst({
      select: { minStudentsToOpenGroup: true },
    });
    const minStudentsToOpenGroup = settingsRow?.minStudentsToOpenGroup ?? 0;

    await syncEnrollmentPhaseAutoClose(prisma);
    const activePeriod = await prisma.academicPeriod.findFirst({
      where: { isActive: true },
      select: {
        id: true,
        enrollmentOpen: true,
        status: true,
        enrollmentPhaseStartDate: true,
        enrollmentPhaseEndDate: true,
      },
    });

    if (!activePeriod) {
      return {
        activePeriodId: null as string | null,
        enrollmentOpen: false,
        pendingInscriptionPayment: false,
        minStudentsToOpenGroup,
        tuitionRequestPhaseActive: false,
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

    const enrollmentOpenEffective = effectiveEnrollmentOpen(activePeriod);

    return {
      activePeriodId: activePeriod.id,
      enrollmentOpen: enrollmentOpenEffective,
      pendingInscriptionPayment: !!pendingInscription,
      minStudentsToOpenGroup,
      tuitionRequestPhaseActive:
        activePeriod.status === "OPEN" &&
        !enrollmentOpenEffective &&
        minStudentsToOpenGroup > 0,
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

    await syncEnrollmentPhaseAutoClose(prisma);
    const period = await prisma.academicPeriod.findUniqueOrThrow({
      where: { id: es.enrollment.academicPeriodId },
    });
    if (!period.isActive) throw new HttpError(400, "El período académico no está activo");
    if (!effectiveEnrollmentOpen(period)) {
      throw new HttpError(400, "El período de inscripción ya cerró. No es posible dar de baja materias.");
    }
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

    await syncMonthlyTuitionInstallmentsGlobal(es.enrollment.studentId, es.enrollment.academicPeriodId);

    return { success: true, message: "Baja de materia exitosa" };
  }
}

export const enrollmentsService = new EnrollmentsService();
