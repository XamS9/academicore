-- Cuota de inscripción por período (primera inscripción a grupo en ese período).
ALTER TABLE "system_settings" ADD COLUMN "inscription_fee" DECIMAL(10,2) NOT NULL DEFAULT 5000;
