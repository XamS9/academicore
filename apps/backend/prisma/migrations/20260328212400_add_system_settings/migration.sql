-- CreateTable
CREATE TABLE "system_settings" (
    "id" UUID NOT NULL,
    "passing_grade" DECIMAL(5,2) NOT NULL DEFAULT 6.0,
    "max_subjects_per_enrollment" SMALLINT NOT NULL DEFAULT 7,
    "max_evaluation_weight" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "at_risk_threshold" SMALLINT NOT NULL DEFAULT 3,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
