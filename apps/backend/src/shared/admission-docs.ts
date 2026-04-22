import { AdmissionDocumentType } from "@prisma/client";

/**
 * Document types that must be APPROVED before an admin can activate
 * a student's account. Extending this list immediately tightens the gate
 * for any student that hasn't yet been activated.
 */
export const REQUIRED_ADMISSION_DOC_TYPES: AdmissionDocumentType[] = [
  "ID_CARD",
  "HIGH_SCHOOL_DIPLOMA",
  "PHOTO",
];

export const ADMISSION_DOC_LABELS: Record<AdmissionDocumentType, string> = {
  ID_CARD: "Documento de identidad",
  HIGH_SCHOOL_DIPLOMA: "Título de bachillerato",
  PHOTO: "Fotografía reciente",
  MEDICAL_CERT: "Certificado médico",
  OTHER: "Otro documento",
};
