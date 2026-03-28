-- AlterTable
ALTER TABLE "certification_criteria" ADD COLUMN     "min_credits" SMALLINT,
ADD COLUMN     "require_all_mandatory" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "classrooms" ADD COLUMN     "deleted_at" TIMESTAMPTZ(6);
