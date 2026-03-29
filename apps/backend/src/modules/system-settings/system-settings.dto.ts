import { z } from 'zod';

export const UpdateSystemSettingsDto = z.object({
  passingGrade: z.number().min(0).max(100).optional(),
  maxSubjectsPerEnrollment: z.number().int().min(1).max(20).optional(),
  maxEvaluationWeight: z.number().min(1).max(1000).optional(),
  atRiskThreshold: z.number().int().min(1).max(20).optional(),
});
export type UpdateSystemSettingsDto = z.infer<typeof UpdateSystemSettingsDto>;
