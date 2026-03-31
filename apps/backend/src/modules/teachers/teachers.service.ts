import { prisma } from "../../shared/prisma.client";
import { HttpError } from "../../shared/http-error";
import { CreateTeacherDto, UpdateTeacherDto } from "./teachers.dto";

class TeachersService {
  async findAll() {
    return prisma.teacher.findMany({
      where: { deletedAt: null },
      include: {
        user: true,
      },
    });
  }

  async findById(id: string) {
    const teacher = await prisma.teacher.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: true,
        groups: true,
      },
    });
    if (!teacher) throw new HttpError(404, "Teacher not found");
    return teacher;
  }

  async findByUserId(userId: string) {
    const teacher = await prisma.teacher.findFirst({
      where: { userId, deletedAt: null },
      include: { user: true },
    });
    if (!teacher) throw new HttpError(404, "Teacher not found");
    return teacher;
  }

  async create(dto: CreateTeacherDto) {
    return prisma.teacher.create({
      data: {
        userId: dto.userId,
        employeeCode: dto.employeeCode,
        department: dto.department,
      },
    });
  }

  async update(id: string, dto: UpdateTeacherDto) {
    await this.findById(id);
    return prisma.teacher.update({
      where: { id },
      data: dto,
    });
  }

  async softDelete(id: string) {
    await this.findById(id);
    return prisma.teacher.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export const teachersService = new TeachersService();
