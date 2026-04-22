-- Remove ENROLLMENT_PROOF: certifications are only for academic achievements
-- configured via certification_criteria (not enrollment status).

DELETE FROM "certifications" WHERE "certification_type" = 'ENROLLMENT_PROOF';
DELETE FROM "certification_criteria" WHERE "certification_type" = 'ENROLLMENT_PROOF';

CREATE TYPE "CertificationType_new" AS ENUM ('DEGREE', 'TRANSCRIPT', 'COMPLETION');

ALTER TABLE "certifications"
  ALTER COLUMN "certification_type" TYPE "CertificationType_new"
  USING ("certification_type"::text::"CertificationType_new");

ALTER TABLE "certification_criteria"
  ALTER COLUMN "certification_type" TYPE "CertificationType_new"
  USING ("certification_type"::text::"CertificationType_new");

DROP TYPE "CertificationType";
ALTER TYPE "CertificationType_new" RENAME TO "CertificationType";
