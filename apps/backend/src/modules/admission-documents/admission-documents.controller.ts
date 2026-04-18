import { Request, Response, NextFunction } from "express";
import { admissionDocumentsService } from "./admission-documents.service";
import {
  CreateAdmissionDocumentDto,
  RejectAdmissionDocumentDto,
} from "./admission-documents.dto";
import { HttpError } from "../../shared/http-error";
import { REQUIRED_ADMISSION_DOC_TYPES, ADMISSION_DOC_LABELS } from "../../shared/admission-docs";

class AdmissionDocumentsController {
  getRequiredTypes = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(
        REQUIRED_ADMISSION_DOC_TYPES.map((type) => ({
          type,
          label: ADMISSION_DOC_LABELS[type],
        })),
      );
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let studentId: string;
      if (req.uploadToken) {
        studentId = req.uploadToken.sub;
      } else if (req.user) {
        const student = await this.getStudentByUserId(req.user.sub);
        studentId = student.id;
      } else {
        throw new HttpError(401, "Unauthenticated");
      }
      const dto = CreateAdmissionDocumentDto.parse(req.body);
      const doc = await admissionDocumentsService.create(studentId, dto);
      res.status(201).json(doc);
    } catch (err) {
      next(err);
    }
  };

  listMine = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new HttpError(401, "Unauthenticated");
      const docs = await admissionDocumentsService.listByUserId(req.user.sub);
      res.json(docs);
    } catch (err) {
      next(err);
    }
  };

  listByStudent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const docs = await admissionDocumentsService.listByStudent(req.params.studentId);
      res.json(docs);
    } catch (err) {
      next(err);
    }
  };

  approve = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new HttpError(401, "Unauthenticated");
      const doc = await admissionDocumentsService.approve(req.params.id, req.user.sub);
      res.json(doc);
    } catch (err) {
      next(err);
    }
  };

  reject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new HttpError(401, "Unauthenticated");
      const dto = RejectAdmissionDocumentDto.parse(req.body);
      const doc = await admissionDocumentsService.reject(req.params.id, req.user.sub, dto);
      res.json(doc);
    } catch (err) {
      next(err);
    }
  };

  private async getStudentByUserId(userId: string) {
    const { prisma } = await import("../../shared/prisma.client");
    const student = await prisma.student.findFirst({
      where: { userId, deletedAt: null },
    });
    if (!student) throw new HttpError(404, "Estudiante no encontrado");
    return student;
  }
}

export const admissionDocumentsController = new AdmissionDocumentsController();
