import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { certificationsService } from './certifications.service';
import { generateCertificatePdf } from './certificate-pdf';

const IssueCertDto = z.object({
  studentId: z.string().uuid(),
  careerId: z.string().uuid().optional(),
  certificationType: z.enum(['DEGREE', 'TRANSCRIPT', 'ENROLLMENT_PROOF', 'COMPLETION']),
});

const RevokeCertDto = z.object({ reason: z.string().min(1).max(500) });

const CreateCriteriaDto = z.object({
  certificationType: z.enum(['DEGREE', 'TRANSCRIPT', 'ENROLLMENT_PROOF', 'COMPLETION']),
  careerId: z.string().uuid().optional(),
  minGrade: z.number().min(0).max(100).default(60),
  validityMonths: z.number().int().min(1),
  minCredits: z.number().int().min(0).optional(),
  requireAllMandatory: z.boolean().default(false),
  description: z.string().max(255).optional(),
});

class CertificationsController {
  findAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await certificationsService.findAll()); } catch (err) { next(err); }
  };

  findByStudent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await certificationsService.findByStudent(req.params.studentId)); } catch (err) { next(err); }
  };

  validateByCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await certificationsService.validateByCode(req.params.code)); } catch (err) { next(err); }
  };

  issue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = IssueCertDto.parse(req.body);
      const cert = await certificationsService.issue(dto, req.user!.sub);
      res.status(201).json(cert);
    } catch (err) { next(err); }
  };

  revoke = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = RevokeCertDto.parse(req.body);
      const cert = await certificationsService.revoke(req.params.id, dto, req.user!.sub);
      res.json(cert);
    } catch (err) { next(err); }
  };

  findCriteria = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try { res.json(await certificationsService.findCriteria()); } catch (err) { next(err); }
  };

  createCriteria = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = CreateCriteriaDto.parse(req.body);
      res.status(201).json(await certificationsService.createCriteria(dto));
    } catch (err) { next(err); }
  };

  downloadPdf = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const pdf = await generateCertificatePdf(req.params.id, frontendUrl);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="certificado-${req.params.id.slice(0, 8)}.pdf"`);
      res.send(pdf);
    } catch (err) { next(err); }
  };
}

export const certificationsController = new CertificationsController();
