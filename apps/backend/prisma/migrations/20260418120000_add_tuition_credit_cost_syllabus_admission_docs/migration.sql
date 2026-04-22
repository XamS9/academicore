-- CreateEnum
CREATE TYPE "AdmissionDocumentType" AS ENUM ('ID_CARD', 'HIGH_SCHOOL_DIPLOMA', 'PHOTO', 'MEDICAL_CERT', 'OTHER');

-- CreateEnum
CREATE TYPE "AdmissionDocumentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "subjects" ADD COLUMN "tuition_amount" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN "credit_cost" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "syllabus_topics" (
    "id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "sort_order" SMALLINT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" VARCHAR(1000),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "syllabus_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_topic_progress" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "teacher_id" UUID NOT NULL,
    "covered_at" DATE NOT NULL,
    "week_number" SMALLINT NOT NULL,
    "notes" VARCHAR(1000),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "group_topic_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_documents" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "type" "AdmissionDocumentType" NOT NULL,
    "file_key" VARCHAR(500) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_mime_type" VARCHAR(100) NOT NULL,
    "status" "AdmissionDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "rejection_reason" VARCHAR(500),
    "uploaded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "admission_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "syllabus_topics_subject_id_sort_order_key" ON "syllabus_topics"("subject_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "group_topic_progress_group_id_topic_id_key" ON "group_topic_progress"("group_id", "topic_id");

-- CreateIndex
CREATE INDEX "idx_admission_docs_student" ON "admission_documents"("student_id");

-- CreateIndex
CREATE INDEX "idx_admission_docs_status" ON "admission_documents"("status");

-- AddForeignKey
ALTER TABLE "syllabus_topics" ADD CONSTRAINT "syllabus_topics_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_topic_progress" ADD CONSTRAINT "group_topic_progress_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_topic_progress" ADD CONSTRAINT "group_topic_progress_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "syllabus_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_topic_progress" ADD CONSTRAINT "group_topic_progress_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_documents" ADD CONSTRAINT "admission_documents_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_documents" ADD CONSTRAINT "admission_documents_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
