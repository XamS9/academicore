-- AlterTable
ALTER TABLE "student_submissions" ADD COLUMN     "file_key" VARCHAR(500),
ADD COLUMN     "file_mime_type" VARCHAR(100),
ADD COLUMN     "file_name" VARCHAR(255),
ADD COLUMN     "file_size" INTEGER;
