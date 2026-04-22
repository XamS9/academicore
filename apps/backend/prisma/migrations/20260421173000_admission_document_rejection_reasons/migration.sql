-- Catálogo estándar de motivos de rechazo para documentos de admisión (IDs fijos).

CREATE TABLE "admission_document_rejection_reasons" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(64),
    "label" VARCHAR(300) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "admission_document_rejection_reasons_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "admission_document_rejection_reasons_code_key"
  ON "admission_document_rejection_reasons"("code");

INSERT INTO "admission_document_rejection_reasons" ("id", "code", "label", "sort_order", "is_active") VALUES
(1, 'INVALID_DOCUMENT', 'Documento inválido', 1, true),
(2, 'DIPLOMA_NOT_LEGALIZED', 'Certificado de bachillerato no legalizado', 2, true),
(3, 'ILLEGIBLE_INCOMPLETE', 'Documento ilegible o incompleto', 3, true),
(4, 'EXPIRED_NOT_VALID', 'Documento vencido o no vigente', 4, true),
(5, 'WRONG_FILE_TYPE', 'El archivo no coincide con el tipo solicitado', 5, true),
(6, 'DATA_MISMATCH', 'Los datos no coinciden con el registro', 6, true),
(7, 'PHOTO_SPECS', 'La fotografía no cumple las especificaciones', 7, true),
(8, 'DIPLOMA_NOT_ALIGNED', 'El certificado de estudios no sustenta la carrera solicitada', 8, true),
(9, 'OTHER', 'Otro (especificar en comentario adicional)', 9, true);

SELECT setval(
  pg_get_serial_sequence('admission_document_rejection_reasons', 'id'),
  (SELECT COALESCE(MAX("id"), 1) FROM "admission_document_rejection_reasons")
);

ALTER TABLE "admission_documents" ADD COLUMN "rejection_reason_id" INTEGER;

ALTER TABLE "admission_documents" ADD CONSTRAINT "admission_documents_rejection_reason_id_fkey"
  FOREIGN KEY ("rejection_reason_id") REFERENCES "admission_document_rejection_reasons"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
