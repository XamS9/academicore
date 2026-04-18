ALTER TABLE "system_settings" ADD COLUMN "cycles_per_year" SMALLINT NOT NULL DEFAULT 2;

ALTER TABLE "student_fees" ADD COLUMN "installment_number" SMALLINT;

ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_cycles_per_year_check"
  CHECK ("cycles_per_year" IN (1, 2, 3, 4, 6, 12));

CREATE UNIQUE INDEX "student_fees_installment_unique"
  ON "student_fees" ("student_id", "period_id", "fee_concept_id", "installment_number")
  WHERE "installment_number" IS NOT NULL;
