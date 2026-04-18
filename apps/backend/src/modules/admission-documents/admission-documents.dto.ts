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

export const RejectAdmissionDocumentDto = z.object({
  reason: z.string().min(1).max(500),
});
export type RejectAdmissionDocumentDto = z.infer<typeof RejectAdmissionDocumentDto>;
