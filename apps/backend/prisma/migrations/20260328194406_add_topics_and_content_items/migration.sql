-- CreateEnum
CREATE TYPE "ContentItemType" AS ENUM ('LINK', 'TEXT', 'FILE_REF');

-- CreateTable
CREATE TABLE "topics" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" VARCHAR(500),
    "sort_order" SMALLINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_items" (
    "id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "type" "ContentItemType" NOT NULL,
    "content" TEXT NOT NULL,
    "sort_order" SMALLINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "content_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "topics_group_id_sort_order_key" ON "topics"("group_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "content_items_topic_id_sort_order_key" ON "content_items"("topic_id", "sort_order");

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
