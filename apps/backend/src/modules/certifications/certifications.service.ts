import crypto from "node:crypto";
import { prisma } from "../../shared/prisma.client";
import { HttpError } from "../../shared/http-error";
import { notificationsService } from "../notifications/notifications.service";

interface IssueCertificationDto {
  studentId: string;
  careerId?: string;
  certificationType:
    | "DEGREE"
    | "TRANSCRIPT"
    | "ENROLLMENT_PROOF"
    | "COMPLETION";
}

interface RevokeCertificationDto {
  reason: string;
}

interface CreateCriteriaDto {
  certificationType:
    | "DEGREE"
    | "TRANSCRIPT"
    | "ENROLLMENT_PROOF"
    | "COMPLETION";
  careerId?: string;
  minGrade: number;
  validityMonths: number;
  minCredits?: number;
  requireAllMandatory?: boolean;
  description?: string;
}

export class CertificationsService {
  async findAll() {
    return prisma.certification.findMany({
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        career: { select: { name: true } },
        issuer: { select: { firstName: true, lastName: true } },
      },
      orderBy: { issuedAt: "desc" },
    });
  }

  async findByStudent(studentId: string) {
    return prisma.certification.findMany({
      where: { studentId },
      include: {
        career: { select: { name: true } },
        issuer: { select: { firstName: true, lastName: true } },
      },
      orderBy: { issuedAt: "desc" },
    });
  }

  async validateByCode(code: string) {
    const cert = await prisma.certification.findFirst({
      where: { verificationCode: code, status: "ACTIVE" },
      include: {
        student: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });
    if (!cert) throw new HttpError(404, "Certificate not found or inactive");
    return {
      studentName: `${cert.student.user.firstName} ${cert.student.user.lastName}`,
      certificationType: cert.certificationType,
      issuedAt: cert.issuedAt,
      status: cert.status,
      expiresAt: cert.expiresAt,
    };
  }

  async issue(dto: IssueCertificationDto, issuedBy: string) {
    const criteria = await prisma.certificationCriteria.findFirst({
      where: {
        certificationType: dto.certificationType,
        ...(dto.careerId ? { careerId: dto.careerId } : { careerId: null }),
      },
    });

    // ── Eligibility validation ──
    if (criteria) {
      const passedRecords = await prisma.academicRecord.findMany({
        where: { studentId: dto.studentId, passed: true },
        include: {
          group: {
            include: { subject: { select: { credits: true, id: true } } },
          },
        },
      });

      // 1. minGrade check: cumulative credit-weighted GPA
      if (Number(criteria.minGrade) > 0) {
        if (passedRecords.length === 0) {
          throw new HttpError(400, "El estudiante no tiene materias aprobadas");
        }

        const totalWeighted = passedRecords.reduce(
          (sum, r) => sum + Number(r.finalGrade) * r.group.subject.credits,
          0,
        );
        const totalCredits = passedRecords.reduce(
          (sum, r) => sum + r.group.subject.credits,
          0,
        );
        const cumulativeGPA =
          totalCredits > 0 ? totalWeighted / totalCredits : 0;

        if (cumulativeGPA < Number(criteria.minGrade)) {
          throw new HttpError(
            400,
            `Promedio acumulado del estudiante (${cumulativeGPA.toFixed(2)}) es menor al mínimo requerido (${criteria.minGrade})`,
          );
        }
      }

      // 2. requireAllMandatory check
      if (criteria.requireAllMandatory && dto.careerId) {
        const mandatorySubjects = await prisma.careerSubject.findMany({
          where: { careerId: dto.careerId, isMandatory: true },
          select: { subjectId: true },
        });

        const passedSubjectIds = new Set(
          passedRecords.map((r) => r.group.subject.id),
        );

        const unpassedMandatory = mandatorySubjects.filter(
          (ms) => !passedSubjectIds.has(ms.subjectId),
        );

        if (unpassedMandatory.length > 0) {
          throw new HttpError(
            400,
            `El estudiante no ha aprobado todas las materias obligatorias (${unpassedMandatory.length} pendientes)`,
          );
        }
      }

      // 3. minCredits check
      if (criteria.minCredits) {
        const totalCredits = passedRecords.reduce(
          (sum, r) => sum + r.group.subject.credits,
          0,
        );

        if (totalCredits < criteria.minCredits) {
          throw new HttpError(
            400,
            `El estudiante tiene ${totalCredits} créditos pero necesita ${criteria.minCredits}`,
          );
        }
      }
    }

    const now = new Date();
    const expiresAt = criteria
      ? new Date(
          now.getFullYear(),
          now.getMonth() + criteria.validityMonths,
          now.getDate(),
        )
      : null;

    const verificationCode = crypto.randomUUID();
    const documentHash = crypto
      .createHash("sha256")
      .update(JSON.stringify({ ...dto, issuedAt: now.toISOString(), issuedBy }))
      .digest("hex");

    const cert = await prisma.certification.create({
      data: {
        studentId: dto.studentId,
        careerId: dto.careerId ?? null,
        certificationType: dto.certificationType,
        status: "ACTIVE",
        verificationCode,
        documentHash,
        issuedBy,
        issuedAt: now,
        expiresAt,
      },
    });

    await prisma.auditLog.create({
      data: {
        entityType: "certification",
        entityId: cert.id,
        action: "ISSUED",
        performedBy: issuedBy,
        newValues: {
          certificationType: dto.certificationType,
          studentId: dto.studentId,
        },
      },
    });

    // Notify student
    const student = await prisma.student.findUnique({
      where: { id: dto.studentId },
      select: { userId: true },
    });
    if (student) {
      const typeLabels: Record<string, string> = {
        DEGREE: "Título",
        TRANSCRIPT: "Historial académico",
        ENROLLMENT_PROOF: "Constancia de inscripción",
        COMPLETION: "Certificado de finalización",
      };
      await notificationsService.create({
        userId: student.userId,
        title: "Certificación emitida",
        message: `Tu ${typeLabels[dto.certificationType] ?? "certificación"} ha sido emitida`,
        type: "CERTIFICATION_ISSUED",
        relatedEntity: "certification",
        relatedEntityId: cert.id,
      });
    }

    return cert;
  }

  async revoke(id: string, dto: RevokeCertificationDto, performedBy: string) {
    const cert = await prisma.certification.findUnique({ where: { id } });
    if (!cert) throw new HttpError(404, "Certification not found");
    if (cert.status === "REVOKED")
      throw new HttpError(400, "Certificate is already revoked");

    const updated = await prisma.certification.update({
      where: { id },
      data: {
        status: "REVOKED" as const,
        revokedAt: new Date(),
        revokedReason: dto.reason,
      },
    });

    await prisma.auditLog.create({
      data: {
        entityType: "certification",
        entityId: id,
        action: "REVOKED",
        performedBy,
        oldValues: { status: "ACTIVE" },
        newValues: { status: "REVOKED", reason: dto.reason },
      },
    });

    return updated;
  }

  async findCriteria() {
    return prisma.certificationCriteria.findMany({
      include: { career: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async createCriteria(dto: CreateCriteriaDto) {
    return prisma.certificationCriteria.create({
      data: {
        certificationType: dto.certificationType,
        careerId: dto.careerId ?? null,
        minGrade: dto.minGrade,
        validityMonths: dto.validityMonths,
        minCredits: dto.minCredits ?? null,
        requireAllMandatory: dto.requireAllMandatory ?? false,
        description: dto.description,
      },
    });
  }
}

export const certificationsService = new CertificationsService();
