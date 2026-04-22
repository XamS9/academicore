import { prisma } from "../../shared/prisma.client";
import { HttpError } from "../../shared/http-error";
import {
  CreateContentItemDto,
  UpdateContentItemDto,
} from "./content-items.dto";

export class ContentItemsService {
  async findByTopic(topicId: string) {
    return prisma.contentItem.findMany({
      where: { topicId },
      orderBy: { sortOrder: "asc" },
    });
  }

  async findById(id: string) {
    const item = await prisma.contentItem.findUnique({ where: { id } });
    if (!item) throw new HttpError(404, "Content item not found");
    return item;
  }

  async create(dto: CreateContentItemDto) {
    const topic = await prisma.topic.findUnique({ where: { id: dto.topicId } });
    if (!topic) throw new HttpError(404, "Topic not found");

    return prisma.contentItem.create({
      data: {
        topicId: dto.topicId,
        title: dto.title,
        type: dto.type,
        content: dto.content,
        sortOrder: dto.sortOrder,
      },
    });
  }

  async update(id: string, dto: UpdateContentItemDto) {
    const existing = await prisma.contentItem.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Content item not found");

    return prisma.contentItem.update({
      where: { id },
      data: {
        ...(dto.topicId !== undefined && { topicId: dto.topicId }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });
  }

  async delete(id: string) {
    const existing = await prisma.contentItem.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Content item not found");
    return prisma.contentItem.delete({ where: { id } });
  }
}

export const contentItemsService = new ContentItemsService();
