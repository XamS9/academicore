import { prisma } from '../../shared/prisma.client';
import { HttpError } from '../../shared/http-error';
import { CreateSubjectDto, UpdateSubjectDto } from './subjects.dto';

class SubjectsService {
  async findAll() {
    return prisma.subject.findMany({
      where: { deletedAt: null },
      include: {
        prerequisites: {
          include: { prerequisite: true },
        },
      },
    });
  }

  async findById(id: string) {
    const subject = await prisma.subject.findFirst({
      where: { id, deletedAt: null },
      include: {
        prerequisites: {
          include: { prerequisite: true },
        },
        isPrereqOf: {
          include: { subject: true },
        },
      },
    });
    if (!subject) throw new HttpError(404, 'Subject not found');
    return subject;
  }

  async create(dto: CreateSubjectDto) {
    return prisma.subject.create({
      data: dto,
    });
  }

  async update(id: string, dto: UpdateSubjectDto) {
    await this.findById(id);
    return prisma.subject.update({
      where: { id },
      data: dto,
    });
  }

  async softDelete(id: string) {
    await this.findById(id);
    return prisma.subject.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async addPrerequisite(subjectId: string, prerequisiteId: string) {
    return prisma.subjectPrerequisite.create({
      data: { subjectId, prerequisiteId },
    });
  }

  async removePrerequisite(subjectId: string, prerequisiteId: string) {
    const existing = await prisma.subjectPrerequisite.findFirst({
      where: { subjectId, prerequisiteId },
    });
    if (!existing) throw new HttpError(404, 'Prerequisite relationship not found');
    return prisma.subjectPrerequisite.delete({
      where: { id: existing.id },
    });
  }
}

export const subjectsService = new SubjectsService();
