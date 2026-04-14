import { prisma } from "../../shared/prisma.client";
import { HttpError } from "../../shared/http-error";
import { notificationsService } from "../notifications/notifications.service";
import {
  CreateAcademicPeriodDto,
  UpdateAcademicPeriodDto,
} from "./academic-periods.dto";

class AcademicPeriodsService {
  async findAll() {
    return prisma.academicPeriod.findMany({ orderBy: { createdAt: "desc" } });
  }

  async findActive() {
    return prisma.academicPeriod.findMany({
      where: { isActive: true },
    });
  }

  async findById(id: string) {
    const period = await prisma.academicPeriod.findUnique({ where: { id } });
    if (!period) throw new HttpError(404, "Academic period not found");
    return period;
  }

  async create(dto: CreateAcademicPeriodDto) {
    return prisma.academicPeriod.create({
      data: {
        name: dto.name,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        enrollmentOpen: dto.enrollmentOpen,
      },
    });
  }

  async update(id: string, dto: UpdateAcademicPeriodDto) {
    const period = await this.findById(id);
    if (period.status === "CLOSED") {
      throw new HttpError(400, "No se puede modificar un período cerrado");
    }

    if (period.status === "GRADING" && dto.enrollmentOpen === true) {
      throw new HttpError(
        400,
        "No se pueden abrir inscripciones durante la fase de calificación. La calificación final se aplica al final del ciclo, con inscripciones cerradas.",
      );
    }

    const data: {
      name?: string;
      startDate?: Date;
      endDate?: Date;
      enrollmentOpen?: boolean;
    } = {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.startDate !== undefined
        ? { startDate: new Date(dto.startDate) }
        : {}),
      ...(dto.endDate !== undefined
        ? { endDate: new Date(dto.endDate) }
        : {}),
    };

    if (period.status === "GRADING") {
      data.enrollmentOpen = false;
    } else if (dto.enrollmentOpen !== undefined) {
      data.enrollmentOpen = dto.enrollmentOpen;
    }

    return prisma.academicPeriod.update({
      where: { id },
      data,
    });
  }

  async toggleEnrollment(id: string) {
    const period = await this.findById(id);
    if (period.status === "CLOSED") {
      throw new HttpError(400, "El período está cerrado");
    }
    if (period.status === "GRADING") {
      throw new HttpError(
        400,
        "No se puede cambiar el estado de inscripciones en fase de calificación. Las inscripciones permanecen cerradas hasta cerrar el período.",
      );
    }
    return prisma.academicPeriod.update({
      where: { id },
      data: { enrollmentOpen: !period.enrollmentOpen },
    });
  }

  async toggleActive(id: string) {
    const period = await this.findById(id);
    return prisma.academicPeriod.update({
      where: { id },
      data: { isActive: !period.isActive },
    });
  }

  // ─── End-Period Workflow ─────────────────────────────────────

  /**
   * Returns per-group grading completion for a period.
   * Used by the admin progress drawer.
   */
  async getPeriodProgress(id: string) {
    const period = await this.findById(id);

    const groups = await prisma.group.findMany({
      where: { academicPeriodId: id },
      include: {
        subject: { select: { name: true, code: true } },
        teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
        evaluations: { select: { id: true } },
        enrollmentSubjects: {
          where: { status: "ENROLLED" },
          select: { id: true, enrollmentId: true },
        },
      },
    });

    const groupProgress = await Promise.all(
      groups.map(async (group) => {
        const totalStudents = group.enrollmentSubjects.length;
        const totalEvals = group.evaluations.length;
        const totalSlots = totalStudents * totalEvals;

        let gradedSlots = 0;
        if (totalSlots > 0) {
          // Count how many (student, evaluation) pairs have a grade
          const studentIds = await prisma.enrollmentSubject
            .findMany({
              where: {
                groupId: group.id,
                status: "ENROLLED",
                enrollment: { academicPeriodId: id },
              },
              include: { enrollment: { select: { studentId: true } } },
            })
            .then((es) => es.map((e) => e.enrollment.studentId));

          gradedSlots = await prisma.grade.count({
            where: {
              evaluationId: { in: group.evaluations.map((e) => e.id) },
              studentId: { in: studentIds },
            },
          });
        }

        const complete =
          totalSlots === 0 || gradedSlots >= totalSlots;

        return {
          groupId: group.id,
          groupCode: group.groupCode,
          subjectName: group.subject.name,
          subjectCode: group.subject.code,
          teacherName: `${group.teacher.user.firstName} ${group.teacher.user.lastName}`,
          totalStudents,
          totalEvals,
          gradedSlots,
          totalSlots,
          complete,
        };
      })
    );

    const totalGroups = groupProgress.length;
    const completedGroups = groupProgress.filter((g) => g.complete).length;
    const overallPct =
      totalGroups === 0 ? 100 : Math.round((completedGroups / totalGroups) * 100);

    return {
      periodId: id,
      periodName: period.name,
      status: period.status,
      totalGroups,
      completedGroups,
      overallPct,
      groups: groupProgress,
    };
  }

  /**
   * OPEN → GRADING: closes enrollment, begins grading phase.
   * Invariant: GRADING and enrollmentOpen=true never coexist (calificación solo al final del ciclo).
   */
  async startGrading(id: string, adminUserId: string) {
    const period = await this.findById(id);
    if (period.status !== "OPEN") {
      throw new HttpError(
        400,
        `No se puede iniciar calificación: el período está en estado ${period.status}`
      );
    }

    const updated = await prisma.academicPeriod.update({
      where: { id },
      data: { status: "GRADING", enrollmentOpen: false },
    });

    await prisma.auditLog.create({
      data: {
        entityType: "academic_period",
        entityId: id,
        action: "STATUS_CHANGE",
        performedBy: adminUserId,
        oldValues: { status: "OPEN" },
        newValues: { status: "GRADING" },
      },
    });

    return updated;
  }

  /**
   * GRADING → CLOSED: finalizes all grades, closes enrollments and groups.
   * force=true allows closing even if not all groups have all grades submitted.
   */
  async closePeriod(
    id: string,
    adminUserId: string,
    force = false
  ) {
    const period = await this.findById(id);
    if (period.status === "CLOSED") {
      throw new HttpError(400, "El período ya está cerrado");
    }
    if (period.status !== "GRADING") {
      throw new HttpError(
        400,
        "El período debe estar en estado CALIFICACIÓN antes de cerrarse. Use 'Iniciar Calificación' primero."
      );
    }

    const progress = await this.getPeriodProgress(id);

    if (!force && progress.completedGroups < progress.totalGroups) {
      const pending = progress.groups
        .filter((g) => !g.complete)
        .map((g) => `${g.subjectCode} ${g.groupCode} (${g.teacherName})`);
      throw new HttpError(
        400,
        `Hay ${pending.length} grupo(s) sin calificar completamente: ${pending.slice(0, 5).join(", ")}${pending.length > 5 ? "..." : ""}. Use force=true para forzar el cierre.`
      );
    }

    await prisma.$transaction(async (tx) => {
      // Lock the row for this transaction
      await tx.$queryRaw`SELECT id FROM academic_periods WHERE id = ${id}::uuid FOR UPDATE`;

      // If force: generate 0-grade academic records for incomplete student-group pairs
      if (force) {
        const incompleteGroups = progress.groups.filter((g) => !g.complete);
        for (const g of incompleteGroups) {
          const enrolledStudents = await tx.enrollmentSubject.findMany({
            where: {
              groupId: g.groupId,
              status: "ENROLLED",
              enrollment: { academicPeriodId: id },
            },
            include: { enrollment: { select: { studentId: true } } },
          });
          for (const es of enrolledStudents) {
            const exists = await tx.academicRecord.findUnique({
              where: {
                studentId_groupId: {
                  studentId: es.enrollment.studentId,
                  groupId: g.groupId,
                },
              },
            });
            if (!exists) {
              await tx.academicRecord.create({
                data: {
                  studentId: es.enrollment.studentId,
                  groupId: g.groupId,
                  academicPeriodId: id,
                  finalGrade: 0,
                  passed: false,
                  attemptNumber: 1,
                },
              });
            }
          }
        }
      }

      // Finalize enrollment_subjects: ENROLLED → COMPLETED or FAILED
      const allEnrolledSubjects = await tx.enrollmentSubject.findMany({
        where: {
          status: "ENROLLED",
          enrollment: { academicPeriodId: id },
          group: { academicPeriodId: id },
        },
        include: { enrollment: { select: { studentId: true } } },
      });

      for (const es of allEnrolledSubjects) {
        const record = await tx.academicRecord.findUnique({
          where: {
            studentId_groupId: {
              studentId: es.enrollment.studentId,
              groupId: es.groupId,
            },
          },
        });
        await tx.enrollmentSubject.update({
          where: { id: es.id },
          data: { status: record?.passed ? "COMPLETED" : "FAILED" },
        });
      }

      // Close enrollment headers for this period
      await tx.enrollment.updateMany({
        where: { academicPeriodId: id, status: "ACTIVE" },
        data: { status: "CLOSED" },
      });

      // Deactivate all groups in this period
      await tx.group.updateMany({
        where: { academicPeriodId: id },
        data: { isActive: false },
      });

      // Close the period itself
      await tx.academicPeriod.update({
        where: { id },
        data: { status: "CLOSED", isActive: false, enrollmentOpen: false },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          entityType: "academic_period",
          entityId: id,
          action: "STATUS_CHANGE",
          performedBy: adminUserId,
          oldValues: { status: "GRADING" },
          newValues: {
            status: "CLOSED",
            totalGroups: progress.totalGroups,
            completedGroups: progress.completedGroups,
            forcedClose: force,
          },
        },
      });
    });

    // Notify all students enrolled in this period
    const affectedEnrollments = await prisma.enrollment.findMany({
      where: { academicPeriodId: id },
      include: { student: { include: { user: { select: { id: true } } } } },
    });

    const userIds = affectedEnrollments.map((e) => e.student.user.id);
    if (userIds.length > 0) {
      await notificationsService.createBulk(userIds, {
        title: "Período académico cerrado",
        message: `El período ${period.name} ha sido cerrado. Tus calificaciones finales ya están disponibles.`,
        type: "GENERAL",
        relatedEntity: "academic_period",
        relatedEntityId: id,
      });
    }

    return { success: true, periodName: period.name };
  }
}

export const academicPeriodsService = new AcademicPeriodsService();
