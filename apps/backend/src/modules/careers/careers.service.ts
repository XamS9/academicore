import { prisma } from "../../shared/prisma.client";
import { HttpError } from "../../shared/http-error";
import { CreateCareerDto, UpdateCareerDto } from "./careers.dto";

class CareersService {
  async findAll() {
    return prisma.career.findMany({
      where: { deletedAt: null },
    });
  }

  async findById(id: string) {
    const career = await prisma.career.findFirst({
      where: { id, deletedAt: null },
      include: {
        careerSubjects: {
          include: {
            subject: {
              include: {
                prerequisites: {
                  include: {
                    prerequisite: { select: { id: true, name: true, code: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!career) throw new HttpError(404, "Career not found");
    return career;
  }

  async create(dto: CreateCareerDto) {
    return prisma.career.create({
      data: dto,
    });
  }

  async update(id: string, dto: UpdateCareerDto) {
    await this.findById(id);
    return prisma.career.update({
      where: { id },
      data: dto,
    });
  }

  async softDelete(id: string) {
    await this.findById(id);
    return prisma.career.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async toggleActive(id: string) {
    const career = await this.findById(id);
    return prisma.career.update({
      where: { id },
      data: { isActive: !career.isActive },
    });
  }
}

export const careersService = new CareersService();
