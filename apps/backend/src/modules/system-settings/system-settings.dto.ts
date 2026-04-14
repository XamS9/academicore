import { z } from "zod";

export const UpdateSystemSettingsDto = z.object({
  passingGrade: z.number().min(0).max(100).optional(),
  maxSubjectsPerEnrollment: z.number().int().min(1).max(20).optional(),
  maxEvaluationWeight: z.number().min(1).max(1000).optional(),
  atRiskThreshold: z.number().int().min(1).max(20).optional(),
  signatureImage1: z.string().nullable().optional(),
  signatureName1: z.string().max(200).nullable().optional(),
  signatureTitle1: z.string().max(200).nullable().optional(),
  signatureImage2: z.string().nullable().optional(),
  signatureName2: z.string().max(200).nullable().optional(),
  signatureTitle2: z.string().max(200).nullable().optional(),
});
export type UpdateSystemSettingsDto = z.infer<typeof UpdateSystemSettingsDto>;
