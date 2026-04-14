-- CreateTable
CREATE TABLE "student_submissions" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "evaluation_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "type" "ContentItemType" NOT NULL,
    "content" TEXT NOT NULL,
    "submitted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "student_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "student_submissions_student_id_evaluation_id_key" ON "student_submissions"("student_id", "evaluation_id");

-- AddForeignKey
ALTER TABLE "student_submissions" ADD CONSTRAINT "student_submissions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_submissions" ADD CONSTRAINT "student_submissions_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "evaluations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
