-- CreateEnum
CREATE TYPE "GroupDeliveryMode" AS ENUM ('ON_SITE', 'VIRTUAL', 'HYBRID');

-- AlterTable
ALTER TABLE "groups" ADD COLUMN "delivery_mode" "GroupDeliveryMode" NOT NULL DEFAULT 'ON_SITE';
