import { prisma } from "../../shared/prisma.client";
import { HttpError } from "../../shared/http-error";
import { storageProvider } from "../../shared/storage";
import {
  CreateStudentSubmissionDto,
  UpdateStudentSubmissionDto,
} from "./student-submissions.dto";

export type CreateStudentSubmissionInput = Omit<
  CreateStudentSubmissionDto,
  "studentId"
> & { studentId: string };

export class StudentSubmissionsService {
  async findByEvaluation(evaluationId: string) {
    return prisma.studentSubmission.findMany({
      where: { evaluationId },
      include: {
        student: {
          select: {
            id: true,
            studentCode: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    });
  }

  async findByStudent(studentId: string) {
    return prisma.studentSubmission.findMany({
      where: { studentId },
      include: {
        evaluation: {
          select: {
            id: true,
            name: true,
            groupId: true,
            dueDate: true,
            weight: true,
            evaluationType: { select: { name: true } },
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    });
  }

  async create(dto: CreateStudentSubmissionInput) {
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: dto.evaluationId },
    });
    if (!evaluation) throw new HttpError(404, "Evaluación no encontrada");

    const existing = await prisma.studentSubmission.findUnique({
      where: {
        studentId_evaluationId: {
          studentId: dto.studentId,
          evaluationId: dto.evaluationId,
        },
      },
    });
    if (existing)
      throw new HttpError(409, "Ya existe una entrega para esta evaluación");

    return prisma.studentSubmission.create({
      data: {
        studentId: dto.studentId,
        evaluationId: dto.evaluationId,
        title: dto.title,
        type: dto.type,
        content: dto.content,
        ...(dto.fileKey && { fileKey: dto.fileKey }),
        ...(dto.fileName && { fileName: dto.fileName }),
        ...(dto.fileSize && { fileSize: dto.fileSize }),
        ...(dto.fileMimeType && { fileMimeType: dto.fileMimeType }),
      },
    });
  }

  async update(id: string, dto: UpdateStudentSubmissionDto) {
    const existing = await prisma.studentSubmission.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Entrega no encontrada");

    // If replacing a FILE_REF with new content (new upload), clean up old file
    if (
      existing.type === "FILE_REF" &&
      dto.content !== undefined &&
      dto.content !== existing.content &&
      existing.fileKey
    ) {
      await storageProvider.delete(existing.fileKey).catch(() => {});
    }

    return prisma.studentSubmission.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.fileKey !== undefined && { fileKey: dto.fileKey }),
        ...(dto.fileName !== undefined && { fileName: dto.fileName }),
        ...(dto.fileSize !== undefined && { fileSize: dto.fileSize }),
        ...(dto.fileMimeType !== undefined && { fileMimeType: dto.fileMimeType }),
      },
    });
  }

  async delete(id: string) {
    const existing = await prisma.studentSubmission.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Entrega no encontrada");

    // Clean up stored file if applicable
    if (existing.type === "FILE_REF" && existing.fileKey) {
      await storageProvider.delete(existing.fileKey).catch(() => {});
    }

    return prisma.studentSubmission.delete({ where: { id } });
  }
}

export const studentSubmissionsService = new StudentSubmissionsService();
