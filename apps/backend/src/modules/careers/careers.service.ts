import { Prisma } from "@prisma/client";
import { prisma } from "../../shared/prisma.client";
import { HttpError } from "../../shared/http-error";
import { allocateUniqueCareerCode } from "../../shared/entity-code.util";
import {
  AddCareerSubjectDto,
  CreateCareerDto,
  UpdateCareerDto,
  UpdateCareerSubjectDto,
} from "./careers.dto";

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
    const { code: rawCode, ...rest } = dto;
    const trimmed = rawCode?.trim();
    const code =
      trimmed && trimmed.length > 0
        ? trimmed
        : await allocateUniqueCareerCode(dto.name);
    return prisma.career.create({
      data: { ...rest, code },
    });
  }

  async suggestCode(name: string) {
    const trimmed = name.trim();
    if (trimmed.length < 1) {
      throw new HttpError(400, "Nombre requerido para sugerir código");
    }
    const code = await allocateUniqueCareerCode(trimmed);
    return { code };
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

  async addSubject(careerId: string, dto: AddCareerSubjectDto) {
    await this.findById(careerId);
    const subject = await prisma.subject.findFirst({
      where: { id: dto.subjectId, deletedAt: null },
    });
    if (!subject) throw new HttpError(404, "Materia no encontrada");

    try {
      return await prisma.careerSubject.create({
        data: {
          careerId,
          subjectId: dto.subjectId,
          semesterNumber: dto.semesterNumber,
          isMandatory: dto.isMandatory ?? true,
        },
        include: {
          subject: {
            select: { id: true, name: true, code: true, credits: true },
          },
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        throw new HttpError(
          409,
          "La materia ya está asignada al plan de esta carrera",
        );
      }
      throw e;
    }
  }

  async updateCareerSubject(
    careerId: string,
    subjectId: string,
    dto: UpdateCareerSubjectDto,
  ) {
    const row = await prisma.careerSubject.findFirst({
      where: { careerId, subjectId },
    });
    if (!row) throw new HttpError(404, "La materia no figura en esta carrera");

    return prisma.careerSubject.update({
      where: { id: row.id },
      data: dto,
      include: {
        subject: {
          select: { id: true, name: true, code: true, credits: true },
        },
      },
    });
  }

  async removeSubject(careerId: string, subjectId: string) {
    const row = await prisma.careerSubject.findFirst({
      where: { careerId, subjectId },
    });
    if (!row) throw new HttpError(404, "La materia no figura en esta carrera");

    await prisma.careerSubject.delete({ where: { id: row.id } });
  }
}

export const careersService = new CareersService();
