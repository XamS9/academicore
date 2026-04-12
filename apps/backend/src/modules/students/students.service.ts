import { prisma } from "../../shared/prisma.client";
import { HttpError } from "../../shared/http-error";
import { CreateStudentDto, UpdateStudentDto } from "./students.dto";

class StudentsService {
  private readonly include = {
    user: { select: { id: true, firstName: true, lastName: true, email: true, isActive: true } },
    career: { select: { id: true, name: true } },
  } as const;

  async findAll() {
    return prisma.student.findMany({
      where: { deletedAt: null },
      include: this.include,
    });
  }

  async findById(id: string) {
    const student = await prisma.student.findFirst({
      where: { id, deletedAt: null },
      include: this.include,
    });
    if (!student) throw new HttpError(404, "Student not found");
    return student;
  }

  async findByUserId(userId: string) {
    const student = await prisma.student.findFirst({
      where: { userId, deletedAt: null },
      include: this.include,
    });
    if (!student) throw new HttpError(404, "Student not found");
    return student;
  }

  async create(dto: CreateStudentDto) {
    return prisma.student.create({
      data: {
        userId: dto.userId,
        studentCode: dto.studentCode,
        careerId: dto.careerId,
        ...(dto.enrollmentDate
          ? { enrollmentDate: new Date(dto.enrollmentDate) }
          : {}),
      },
    });
  }

  async update(id: string, dto: UpdateStudentDto) {
    await this.findById(id);
    return prisma.student.update({
      where: { id },
      data: dto,
    });
  }

  async approve(id: string) {
    const student = await this.findById(id);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: student.userId },
        data: { isActive: true },
      }),
      prisma.student.update({
        where: { id },
        data: { academicStatus: "ACTIVE" },
      }),
    ]);
    return this.findById(id);
  }

  async softDelete(id: string) {
    await this.findById(id);
    return prisma.student.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export const studentsService = new StudentsService();
