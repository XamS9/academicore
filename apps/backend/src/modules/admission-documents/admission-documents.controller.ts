import { Request, Response, NextFunction } from "express";
import { admissionDocumentsService } from "./admission-documents.service";
import {
  CreateAdmissionDocumentDto,
  RejectAdmissionDocumentDto,
  CreateRejectionReasonDto,
  UpdateRejectionReasonDto,
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

  listRejectionReasons = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const rows = await admissionDocumentsService.listActiveRejectionReasons();
      res.json(rows);
    } catch (err) {
      next(err);
    }
  };

  listRejectionReasonsAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const rows = await admissionDocumentsService.listAllRejectionReasons();
      res.json(rows);
    } catch (err) {
      next(err);
    }
  };

  createRejectionReason = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = CreateRejectionReasonDto.parse(req.body);
      const row = await admissionDocumentsService.createRejectionReason(dto);
      res.status(201).json(row);
    } catch (err) {
      next(err);
    }
  };

  updateRejectionReason = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number.parseInt(req.params.id, 10);
      if (Number.isNaN(id) || id < 1) {
        throw new HttpError(400, "Id inválido");
      }
      const dto = UpdateRejectionReasonDto.parse(req.body);
      const row = await admissionDocumentsService.updateRejectionReason(id, dto);
      res.json(row);
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
