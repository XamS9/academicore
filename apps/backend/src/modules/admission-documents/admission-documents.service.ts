import { prisma } from "../../shared/prisma.client";
import { HttpError } from "../../shared/http-error";
import { storageProvider } from "../../shared/storage";
import { REQUIRED_ADMISSION_DOC_TYPES } from "../../shared/admission-docs";
import { isAllRequiredAdmissionDocsApproved } from "../../shared/admission-docs-status";
import { notificationsService } from "../notifications/notifications.service";
import {
  CreateAdmissionDocumentDto,
  RejectAdmissionDocumentDto,
} from "./admission-documents.dto";
import type { CreateRejectionReasonDto, UpdateRejectionReasonDto } from "./admission-documents.dto";

function normalizeRejectionCode(code: string | null | undefined): string | null {
  if (code === undefined || code === null) return null;
  const t = code.trim();
  if (!t) return null;
  return t
    .toUpperCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^A-Z0-9_]/g, "");
}

const docIncludeStandardReason = {
  standardRejectionReason: {
    select: { id: true, code: true, label: true },
  },
} as const;

class AdmissionDocumentsService {
  async listActiveRejectionReasons() {
    return prisma.admissionDocumentRejectionReason.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, code: true, label: true },
    });
  }

  /** Incluye inactivos; para pantalla de administración. */
  async listAllRejectionReasons() {
    return prisma.admissionDocumentRejectionReason.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      select: {
        id: true,
        code: true,
        label: true,
        sortOrder: true,
        isActive: true,
      },
    });
  }

  async createRejectionReason(dto: CreateRejectionReasonDto) {
    const code = normalizeRejectionCode(dto.code);
    if (code) {
      const dup = await prisma.admissionDocumentRejectionReason.findFirst({
        where: { code },
      });
      if (dup) throw new HttpError(400, "Ya existe un motivo con ese código");
    }
    return prisma.admissionDocumentRejectionReason.create({
      data: {
        label: dto.label,
        code,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
      select: {
        id: true,
        code: true,
        label: true,
        sortOrder: true,
        isActive: true,
      },
    });
  }

  async updateRejectionReason(id: number, dto: UpdateRejectionReasonDto) {
    const row = await prisma.admissionDocumentRejectionReason.findUnique({ where: { id } });
    if (!row) throw new HttpError(404, "Motivo no encontrado");

    if (Object.keys(dto).length === 0) {
      throw new HttpError(400, "Nada que actualizar");
    }

    let code: string | null | undefined = undefined;
    if (dto.code !== undefined) {
      code = normalizeRejectionCode(dto.code);
      if (code) {
        const dup = await prisma.admissionDocumentRejectionReason.findFirst({
          where: { code, id: { not: id } },
        });
        if (dup) throw new HttpError(400, "Ya existe un motivo con ese código");
      }
    }

    return prisma.admissionDocumentRejectionReason.update({
      where: { id },
      data: {
        ...(dto.label !== undefined ? { label: dto.label } : {}),
        ...(code !== undefined ? { code } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
      select: {
        id: true,
        code: true,
        label: true,
        sortOrder: true,
        isActive: true,
      },
    });
  }

  async listByStudent(studentId: string) {
    return prisma.admissionDocument.findMany({
      where: { studentId },
      orderBy: { uploadedAt: "asc" },
      include: docIncludeStandardReason,
    });
  }

  async listByUserId(userId: string) {
    const student = await prisma.student.findFirst({
      where: { userId, deletedAt: null },
    });
    if (!student) throw new HttpError(404, "Estudiante no encontrado");
    return this.listByStudent(student.id);
  }

  async create(studentId: string, dto: CreateAdmissionDocumentDto) {
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new HttpError(404, "Estudiante no encontrado");

    // Replace any existing doc of the same type for this student (re-upload flow)
    const existing = await prisma.admissionDocument.findFirst({
      where: { studentId, type: dto.type },
    });
    if (existing) {
      // best-effort cleanup of the previous file
      try {
        await storageProvider.delete(existing.fileKey);
      } catch {
        /* ignore storage errors */
      }
      await prisma.admissionDocument.delete({ where: { id: existing.id } });
    }

    return prisma.admissionDocument.create({
      data: {
        studentId,
        type: dto.type,
        fileKey: dto.fileKey,
        fileName: dto.fileName,
        fileSize: dto.fileSize,
        fileMimeType: dto.fileMimeType,
        status: "PENDING",
      },
      include: docIncludeStandardReason,
    });
  }

  async approve(id: string, reviewerUserId: string) {
    const doc = await prisma.admissionDocument.findUnique({ where: { id } });
    if (!doc) throw new HttpError(404, "Documento no encontrado");

    const updated = await prisma.admissionDocument.update({
      where: { id },
      data: {
        status: "APPROVED",
        reviewedBy: reviewerUserId,
        reviewedAt: new Date(),
        rejectionReasonId: null,
        rejectionReason: null,
      },
      include: docIncludeStandardReason,
    });

    const student = await prisma.student.findUnique({
      where: { id: doc.studentId },
      select: { userId: true },
    });
    if (student) {
      await notificationsService.create({
        userId: student.userId,
        title: "Documento aprobado",
        message: `Tu documento fue aprobado`,
        type: "GENERAL",
        relatedEntity: "admission_document",
        relatedEntityId: id,
      });
    }

    return updated;
  }

  async reject(id: string, reviewerUserId: string, dto: RejectAdmissionDocumentDto) {
    const doc = await prisma.admissionDocument.findUnique({ where: { id } });
    if (!doc) throw new HttpError(404, "Documento no encontrado");

    const standard = await prisma.admissionDocumentRejectionReason.findFirst({
      where: { id: dto.reasonId, isActive: true },
    });
    if (!standard) {
      throw new HttpError(400, "Motivo de rechazo no válido o inactivo");
    }
    const detail = dto.detail?.trim() ?? "";
    if (standard.code === "OTHER" && !detail) {
      throw new HttpError(400, "Debes indicar el detalle cuando el motivo es «Otro»");
    }

    const updated = await prisma.admissionDocument.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedBy: reviewerUserId,
        reviewedAt: new Date(),
        rejectionReasonId: dto.reasonId,
        rejectionReason: detail || null,
      },
      include: docIncludeStandardReason,
    });

    const student = await prisma.student.findUnique({
      where: { id: doc.studentId },
      select: { userId: true },
    });
    const summary =
      detail && standard.code !== "OTHER"
        ? `${standard.label} — ${detail}`
        : detail
          ? `${standard.label}: ${detail}`
          : standard.label;
    if (student) {
      await notificationsService.create({
        userId: student.userId,
        title: "Documento rechazado",
        message: `Un documento de admisión fue rechazado: ${summary}`,
        type: "GENERAL",
        relatedEntity: "admission_document",
        relatedEntityId: id,
      });
    }

    return updated;
  }

  /**
   * Returns `true` if every required admission document type is APPROVED.
   * Used as a gate before admin activates a pending student account.
   */
  async allRequiredApproved(studentId: string): Promise<boolean> {
    const docs = await prisma.admissionDocument.findMany({
      where: { studentId },
      select: { type: true, status: true },
    });
    return isAllRequiredAdmissionDocsApproved(docs);
  }

  async missingOrUnapproved(studentId: string) {
    const docs = await prisma.admissionDocument.findMany({
      where: { studentId },
    });
    const byType = new Map(docs.map((d) => [d.type, d]));
    return REQUIRED_ADMISSION_DOC_TYPES.map((type) => ({
      type,
      status: byType.get(type)?.status ?? "MISSING",
    })).filter((x) => x.status !== "APPROVED");
  }
}

export const admissionDocumentsService = new AdmissionDocumentsService();
