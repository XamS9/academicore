import { prisma } from '../../shared/prisma.client';
import { HttpError } from '../../shared/http-error';
import { CreateTopicDto, UpdateTopicDto } from './topics.dto';

export class TopicsService {
  async findByGroup(groupId: string) {
    return prisma.topic.findMany({
      where: { groupId },
      include: { contentItems: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findById(id: string) {
    const topic = await prisma.topic.findUnique({
      where: { id },
      include: { contentItems: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!topic) throw new HttpError(404, 'Topic not found');
    return topic;
  }

  async create(dto: CreateTopicDto) {
    const group = await prisma.group.findUnique({ where: { id: dto.groupId } });
    if (!group) throw new HttpError(404, 'Group not found');

    return prisma.topic.create({
      data: {
        groupId: dto.groupId,
        title: dto.title,
        description: dto.description,
        sortOrder: dto.sortOrder,
      },
      include: { contentItems: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async update(id: string, dto: UpdateTopicDto) {
    const existing = await prisma.topic.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, 'Topic not found');

    return prisma.topic.update({
      where: { id },
      data: {
        ...(dto.groupId !== undefined && { groupId: dto.groupId }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
      include: { contentItems: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async delete(id: string) {
    const existing = await prisma.topic.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, 'Topic not found');
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
