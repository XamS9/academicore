import { z } from 'zod';

export const CreateFeeConceptDto = z.object({
  name: z.string().min(1).max(200),
  amount: z.number().positive(),
  description: z.string().max(500).optional(),
});

export const UpdateFeeConceptDto = CreateFeeConceptDto.partial();

export const AssignStudentFeeDto = z.object({
  studentId: z.string().uuid(),
  feeConceptId: z.string().uuid(),
  periodId: z.string().uuid(),
  amount: z.number().positive(),
  dueDate: z.coerce.date(),
});

export const BulkAssignStudentFeeDto = z.object({
  studentIds: z.array(z.string().uuid()).min(1),
  feeConceptId: z.string().uuid(),
  periodId: z.string().uuid(),
  amount: z.number().positive(),
  dueDate: z.coerce.date(),
});

export const PayStudentFeeDto = z.object({
  method: z.enum(['CARD', 'TRANSFER', 'CASH']),
});

export type CreateFeeConceptInput = z.infer<typeof CreateFeeConceptDto>;
export type UpdateFeeConceptInput = z.infer<typeof UpdateFeeConceptDto>;
export type AssignStudentFeeInput = z.infer<typeof AssignStudentFeeDto>;
export type BulkAssignStudentFeeInput = z.infer<typeof BulkAssignStudentFeeDto>;
export type PayStudentFeeInput = z.infer<typeof PayStudentFeeDto>;
