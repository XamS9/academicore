import crypto from 'node:crypto';
import { prisma } from '../../shared/prisma.client';
import { HttpError } from '../../shared/http-error';

interface IssueCertificationDto {
  studentId: string;
  careerId?: string;
  certificationType: 'DEGREE' | 'TRANSCRIPT' | 'ENROLLMENT_PROOF' | 'COMPLETION';
}

interface RevokeCertificationDto {
  reason: string;
}

interface CreateCriteriaDto {
  certificationType: 'DEGREE' | 'TRANSCRIPT' | 'ENROLLMENT_PROOF' | 'COMPLETION';
  careerId?: string;
  minGrade: number;
  validityMonths: number;
  description?: string;
}

export class CertificationsService {
  async findAll() {
    return prisma.certification.findMany({
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        career: { select: { name: true } },
        issuer: { select: { firstName: true, lastName: true } },
      },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async findByStudent(studentId: string) {
    return prisma.certification.findMany({
      where: { studentId },
      include: {
        career: { select: { name: true } },
        issuer: { select: { firstName: true, lastName: true } },
      },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async validateByCode(code: string) {
    const cert = await prisma.certification.findFirst({
      where: { verificationCode: code, status: 'ACTIVE' },
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    });
    if (!cert) throw new HttpError(404, 'Certificate not found or inactive');
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

    const now = new Date();
    const expiresAt = criteria
      ? new Date(now.getFullYear(), now.getMonth() + criteria.validityMonths, now.getDate())
      : null;

    const verificationCode = crypto.randomUUID();
    const documentHash = crypto
      .createHash('sha256')
      .update(JSON.stringify({ ...dto, issuedAt: now.toISOString(), issuedBy }))
      .digest('hex');

    const cert = await prisma.certification.create({
      data: {
        studentId: dto.studentId,
        careerId: dto.careerId ?? null,
        certificationType: dto.certificationType,
        status: 'ACTIVE',
        verificationCode,
        documentHash,
        issuedBy,
        issuedAt: now,
        expiresAt,
      },
    });

    await prisma.auditLog.create({
      data: {
        entityType: 'certification',
        entityId: cert.id,
        action: 'ISSUED',
        performedBy: issuedBy,
        newValues: { certificationType: dto.certificationType, studentId: dto.studentId },
      },
    });

    return cert;
  }

  async revoke(id: string, dto: RevokeCertificationDto, performedBy: string) {
    const cert = await prisma.certification.findUnique({ where: { id } });
    if (!cert) throw new HttpError(404, 'Certification not found');
    if (cert.status === 'REVOKED') throw new HttpError(400, 'Certificate is already revoked');

    const updated = await prisma.certification.update({
      where: { id },
      data: { status: 'REVOKED' as const, revokedAt: new Date(), revokedReason: dto.reason },
    });

    await prisma.auditLog.create({
      data: {
        entityType: 'certification',
        entityId: id,
        action: 'REVOKED',
        performedBy,
        oldValues: { status: 'ACTIVE' },
        newValues: { status: 'REVOKED', reason: dto.reason },
      },
    });

    return updated;
  }

  async findCriteria() {
    return prisma.certificationCriteria.findMany({
      include: { career: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCriteria(dto: CreateCriteriaDto) {
    return prisma.certificationCriteria.create({
      data: {
        certificationType: dto.certificationType,
        careerId: dto.careerId ?? null,
        minGrade: dto.minGrade,
        validityMonths: dto.validityMonths,
        description: dto.description,
      },
    });
  }
}

export const certificationsService = new CertificationsService();
