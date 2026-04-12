import { prisma } from "../../shared/prisma.client";
import { HttpError } from "../../shared/http-error";
import { CreateTopicDto, UpdateTopicDto, CloneTopicsDto } from "./topics.dto";

export class TopicsService {
  async findByGroup(groupId: string) {
    return prisma.topic.findMany({
      where: { groupId },
      include: { contentItems: { orderBy: { sortOrder: "asc" } } },
      orderBy: { sortOrder: "asc" },
    });
  }

  async findById(id: string) {
    const topic = await prisma.topic.findUnique({
      where: { id },
      include: { contentItems: { orderBy: { sortOrder: "asc" } } },
    });
    if (!topic) throw new HttpError(404, "Topic not found");
    return topic;
  }

  async create(dto: CreateTopicDto) {
    const group = await prisma.group.findUnique({ where: { id: dto.groupId } });
    if (!group) throw new HttpError(404, "Group not found");

    return prisma.topic.create({
      data: {
        groupId: dto.groupId,
        title: dto.title,
        description: dto.description,
        sortOrder: dto.sortOrder,
        weekNumber: dto.weekNumber,
      },
      include: { contentItems: { orderBy: { sortOrder: "asc" } } },
    });
  }

  async update(id: string, dto: UpdateTopicDto) {
    const existing = await prisma.topic.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Topic not found");

    return prisma.topic.update({
      where: { id },
      data: {
        ...(dto.groupId !== undefined && { groupId: dto.groupId }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.weekNumber !== undefined && { weekNumber: dto.weekNumber }),
      },
      include: { contentItems: { orderBy: { sortOrder: "asc" } } },
    });
  }

  async cloneFromGroup(dto: CloneTopicsDto) {
    const { sourceGroupId, targetGroupId } = dto;

    if (sourceGroupId === targetGroupId) {
      throw new HttpError(400, "El grupo origen y destino deben ser diferentes");
    }

    const [sourceTopics, targetGroup] = await Promise.all([
      prisma.topic.findMany({
        where: { groupId: sourceGroupId },
        include: { contentItems: { orderBy: { sortOrder: "asc" } } },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.group.findUnique({ where: { id: targetGroupId } }),
    ]);

    if (!targetGroup) throw new HttpError(404, "Grupo destino no encontrado");
    if (sourceTopics.length === 0) throw new HttpError(404, "El grupo origen no tiene temas");

    // Replace existing topics in target group
    await prisma.topic.deleteMany({ where: { groupId: targetGroupId } });

    await prisma.$transaction(async (tx) => {
      for (const topic of sourceTopics) {
        const newTopic = await tx.topic.create({
          data: {
            groupId: targetGroupId,
            title: topic.title,
            description: topic.description,
            sortOrder: topic.sortOrder,
            weekNumber: topic.weekNumber,
          },
        });
        for (const item of topic.contentItems) {
          await tx.contentItem.create({
            data: {
              topicId: newTopic.id,
              title: item.title,
              type: item.type,
              content: item.content,
              sortOrder: item.sortOrder,
            },
          });
        }
      }
    });

    return this.findByGroup(targetGroupId);
  }

  async delete(id: string) {
    const existing = await prisma.topic.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Topic not found");
    return prisma.topic.delete({ where: { id } });
  }

  async reorder(groupId: string, orderedIds: string[]) {
    return prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.topic.update({
          where: { id },
          data: { sortOrder: index + 1 },
        }),
      ),
    );
  }
}

export const topicsService = new TopicsService();
