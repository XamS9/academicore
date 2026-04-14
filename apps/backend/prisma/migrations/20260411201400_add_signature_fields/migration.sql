-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN     "signature_image_1" TEXT,
ADD COLUMN     "signature_image_2" TEXT,
ADD COLUMN     "signature_name_1" VARCHAR(200),
ADD COLUMN     "signature_name_2" VARCHAR(200),
ADD COLUMN     "signature_title_1" VARCHAR(200),
ADD COLUMN     "signature_title_2" VARCHAR(200);
