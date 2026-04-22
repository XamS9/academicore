-- CreateEnum
CREATE TYPE "TuitionRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN     "min_students_to_open_group" SMALLINT NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "tuition_group_requests" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "academic_period_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "status" "TuitionRequestStatus" NOT NULL DEFAULT 'PENDING',
    "student_note" VARCHAR(500),
    "admin_note" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tuition_group_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_tuition_req_student_period" ON "tuition_group_requests"("student_id", "academic_period_id");

-- CreateIndex
CREATE INDEX "idx_tuition_req_status" ON "tuition_group_requests"("status");

-- AddForeignKey
ALTER TABLE "tuition_group_requests" ADD CONSTRAINT "tuition_group_requests_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tuition_group_requests" ADD CONSTRAINT "tuition_group_requests_academic_period_id_fkey" FOREIGN KEY ("academic_period_id") REFERENCES "academic_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tuition_group_requests" ADD CONSTRAINT "tuition_group_requests_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tuition_group_requests" ADD CONSTRAINT "tuition_group_requests_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
