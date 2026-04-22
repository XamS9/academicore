import { prisma } from "../../shared/prisma.client";
import { HttpError } from "../../shared/http-error";
import { CreateClassroomDto, UpdateClassroomDto } from "./classrooms.dto";

class ClassroomsService {
  async findAll() {
    return prisma.classroom.findMany({
      where: { deletedAt: null },
    });
  }

  async findById(id: string) {
    const classroom = await prisma.classroom.findFirst({
      where: { id, deletedAt: null },
    });
    if (!classroom) throw new HttpError(404, "Classroom not found");
    return classroom;
  }

  async create(dto: CreateClassroomDto) {
    return prisma.classroom.create({
      data: dto,
    });
  }

  async update(id: string, dto: UpdateClassroomDto) {
    await this.findById(id);
    return prisma.classroom.update({
      where: { id },
      data: dto,
    });
  }

  async toggleActive(id: string) {
    const classroom = await this.findById(id);
    return prisma.classroom.update({
      where: { id },
      data: { isActive: !classroom.isActive },
    });
  }

  async softDelete(id: string) {
    await this.findById(id);
    return prisma.classroom.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export const classroomsService = new ClassroomsService();
