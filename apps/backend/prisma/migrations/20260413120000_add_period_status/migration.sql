-- CreateEnum
CREATE TYPE "PeriodStatus" AS ENUM ('OPEN', 'GRADING', 'CLOSED');

-- AlterTable: add status column with default OPEN
ALTER TABLE "academic_periods" ADD COLUMN "status" "PeriodStatus" NOT NULL DEFAULT 'OPEN';

-- Backfill: periods that are inactive and not open for enrollment are likely closed
UPDATE "academic_periods"
SET "status" = 'CLOSED'
WHERE "is_active" = false AND "enrollment_open" = false;
