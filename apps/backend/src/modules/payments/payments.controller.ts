import { Request, Response, NextFunction } from 'express';
import { paymentsService } from './payments.service';
import {
  CreateFeeConceptDto,
  UpdateFeeConceptDto,
  AssignStudentFeeDto,
  BulkAssignStudentFeeDto,
  PayStudentFeeDto,
} from './payments.dto';

class PaymentsController {
  // ── Fee Concepts ──────────────────────────────────────────────

  findAllFeeConcepts = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await paymentsService.findAllFeeConcepts());
    } catch (err) {
      next(err);
    }
  };

  createFeeConcept = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = CreateFeeConceptDto.parse(req.body);
      res.status(201).json(await paymentsService.createFeeConcept(data));
    } catch (err) {
      next(err);
    }
  };

  updateFeeConcept = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = UpdateFeeConceptDto.parse(req.body);
      res.json(await paymentsService.updateFeeConcept(req.params.id, data));
    } catch (err) {
      next(err);
    }
  };

  // ── Student Fees ──────────────────────────────────────────────

  findStudentFees = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userType, sub } = req.user!;
      if (userType === 'STUDENT') {
        res.json(await paymentsService.findStudentFeesByUserId(sub));
      } else {
        const studentId = req.query.studentId as string | undefined;
        const periodId = req.query.periodId as string | undefined;
        const status = req.query.status as string | undefined;
        res.json(await paymentsService.findStudentFees({ studentId, periodId, status }));
      }
    } catch (err) {
      next(err);
    }
  };

  assignFee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = AssignStudentFeeDto.parse(req.body);
      res.status(201).json(await paymentsService.assignFee(data));
    } catch (err) {
      next(err);
    }
  };

  bulkAssignFees = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = BulkAssignStudentFeeDto.parse(req.body);
      res.status(201).json(await paymentsService.bulkAssignFees(data));
    } catch (err) {
      next(err);
    }
  };

  // ── Payment ───────────────────────────────────────────────────

  pay = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = PayStudentFeeDto.parse(req.body);
      const payment = await paymentsService.pay(req.params.studentFeeId, req.user!.sub, data);
      res.status(201).json(payment);
    } catch (err) {
      next(err);
    }
  };

  findPaymentHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await paymentsService.findPaymentHistory(req.user!.sub));
    } catch (err) {
      next(err);
    }
  };
}

export const paymentsController = new PaymentsController();
