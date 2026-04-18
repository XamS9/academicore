import { prisma } from "../../shared/prisma.client";
import { HttpError } from "../../shared/http-error";
import { storageProvider } from "../../shared/storage";
import { REQUIRED_ADMISSION_DOC_TYPES } from "../../shared/admission-docs";
import { notificationsService } from "../notifications/notifications.service";
import {
  CreateAdmissionDocumentDto,
  RejectAdmissionDocumentDto,
} from "./admission-documents.dto";

class AdmissionDocumentsService {
  async listByStudent(studentId: string) {
    return prisma.admissionDocument.findMany({
      where: { studentId },
      orderBy: { uploadedAt: "asc" },
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
        rejectionReason: null,
      },
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

    const updated = await prisma.admissionDocument.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedBy: reviewerUserId,
        reviewedAt: new Date(),
        rejectionReason: dto.reason,
      },
    });

    const student = await prisma.student.findUnique({
      where: { id: doc.studentId },
      select: { userId: true },
    });
    if (student) {
      await notificationsService.create({
        userId: student.userId,
        title: "Documento rechazado",
        message: `Un documento de admisión fue rechazado: ${dto.reason}`,
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
    const approvedByType = new Set(
      docs.filter((d) => d.status === "APPROVED").map((d) => d.type),
    );
    return REQUIRED_ADMISSION_DOC_TYPES.every((t) => approvedByType.has(t));
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
