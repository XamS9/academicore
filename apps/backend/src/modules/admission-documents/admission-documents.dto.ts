import { z } from "zod";

export const AdmissionDocumentTypeSchema = z.enum([
  "ID_CARD",
  "HIGH_SCHOOL_DIPLOMA",
  "PHOTO",
  "MEDICAL_CERT",
  "OTHER",
]);

export const CreateAdmissionDocumentDto = z.object({
  type: AdmissionDocumentTypeSchema,
  fileKey: z.string().min(1).max(500),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().nonnegative(),
  fileMimeType: z.string().min(1).max(100),
});
export type CreateAdmissionDocumentDto = z.infer<typeof CreateAdmissionDocumentDto>;

/** Motivo estándar (`admission_document_rejection_reasons.id`); `detail` obligatorio si el motivo es "Otro". */
export const RejectAdmissionDocumentDto = z
  .object({
    reasonId: z.number().int().positive(),
    detail: z.string().max(500).optional(),
  })
  .strict();
export type RejectAdmissionDocumentDto = z.infer<typeof RejectAdmissionDocumentDto>;

/** Admin: crear motivo de rechazo (catálogo de admisión). */
export const CreateRejectionReasonDto = z
  .object({
    label: z.string().min(1).max(300).trim(),
    code: z.string().max(64).optional().nullable(),
    sortOrder: z.number().int().min(0).max(99_999).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();
export type CreateRejectionReasonDto = z.infer<typeof CreateRejectionReasonDto>;

/** Admin: actualizar motivo (cualquier campo parcial). */
export const UpdateRejectionReasonDto = z
  .object({
    label: z.string().min(1).max(300).trim().optional(),
    code: z.string().max(64).optional().nullable(),
    sortOrder: z.number().int().min(0).max(99_999).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();
export type UpdateRejectionReasonDto = z.infer<typeof UpdateRejectionReasonDto>;
