import { z } from "zod";

export const UpdateSystemSettingsDto = z.object({
  passingGrade: z.number().min(0).max(100).optional(),
  maxSubjectsPerEnrollment: z.number().int().min(1).max(20).optional(),
  maxEvaluationWeight: z.number().min(1).max(1000).optional(),
  atRiskThreshold: z.number().int().min(1).max(20).optional(),
  creditCost: z.number().nonnegative().max(1000000).optional(),
  /** Cuota automática al primera inscripción a un grupo en un período (requiere concepto activo «inscripci»). Use 0 para no generar cargo. */
  inscriptionFee: z.number().nonnegative().max(1000000).optional(),
  cyclesPerYear: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(6), z.literal(12)]).optional(),
  /** Upper bound for `Subject.credits` (single course). */
  maxCreditsPerSubject: z.number().int().min(1).max(99).optional(),
  signatureImage1: z.string().nullable().optional(),
  signatureName1: z.string().max(200).nullable().optional(),
  signatureTitle1: z.string().max(200).nullable().optional(),
  signatureImage2: z.string().nullable().optional(),
  signatureName2: z.string().max(200).nullable().optional(),
  signatureTitle2: z.string().max(200).nullable().optional(),
});
export type UpdateSystemSettingsDto = z.infer<typeof UpdateSystemSettingsDto>;
