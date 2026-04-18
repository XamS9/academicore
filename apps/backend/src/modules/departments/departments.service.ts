import { Prisma } from "@prisma/client";
import { prisma } from "../../shared/prisma.client";
import { HttpError } from "../../shared/http-error";
import type { CreateDepartmentDto, UpdateDepartmentDto } from "./departments.dto";

export class DepartmentsService {
  async findAll() {
    return prisma.department.findMany({ orderBy: { name: "asc" } });
  }

  async create(dto: CreateDepartmentDto) {
    const name = dto.name.trim();
    try {
      return await prisma.department.create({ data: { name } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new HttpError(409, "Ya existe un departamento con ese nombre");
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    const existing = await prisma.department.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Departamento no encontrado");

    const newName = dto.name.trim();
    if (newName === existing.name) return existing;

    try {
      await prisma.$transaction(async (tx) => {
        await tx.teacher.updateMany({
          where: { deletedAt: null, department: existing.name },
          data: { department: newName },
        });
        await tx.department.update({
          where: { id },
          data: { name: newName },
        });
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new HttpError(409, "Ya existe un departamento con ese nombre");
      }
      throw e;
    }

    const updated = await prisma.department.findUnique({ where: { id } });
    if (!updated) throw new HttpError(404, "Departamento no encontrado");
    return updated;
  }

  async delete(id: string) {
    const existing = await prisma.department.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Departamento no encontrado");

    const teachersCount = await prisma.teacher.count({
      where: { deletedAt: null, department: existing.name },
    });
    if (teachersCount > 0) {
      throw new HttpError(
        400,
        `No se puede eliminar: ${teachersCount} docente(s) tienen este departamento asignado. Reasigne o quite el departamento en Usuarios antes de eliminar.`,
      );
    }

    await prisma.department.delete({ where: { id } });
  }
}

export const departmentsService = new DepartmentsService();
