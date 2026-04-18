import bcrypt from "bcryptjs";
import { prisma } from "../../shared/prisma.client";
import { HttpError } from "../../shared/http-error";
import {
  allocateUniqueEmployeeCode,
  allocateUniqueStudentCode,
} from "../../shared/entity-code.util";
import { CreateUserDto, UpdateUserDto } from "./users.dto";

class UsersService {
  async findAll() {
    return prisma.user.findMany({
      where: { deletedAt: null },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });
  }

  async findById(id: string) {
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });
    if (!user) throw new HttpError(404, "User not found");
    return user;
  }

  async create(dto: CreateUserDto) {
    const existing = await prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
    });
    if (existing) {
      throw new HttpError(409, "Ya existe un usuario con este correo");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const roleName =
      dto.userType === "ADMIN"
        ? "ADMIN"
        : dto.userType === "TEACHER"
          ? "TEACHER"
          : "STUDENT";

    return prisma.$transaction(async (tx) => {
      const academicStatus =
        dto.userType === "STUDENT" ? (dto.academicStatus ?? "ACTIVE") : undefined;
      const isActive =
        dto.userType === "STUDENT" && academicStatus === "PENDING" ? false : true;

      const user = await tx.user.create({
        data: {
          userType: dto.userType,
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          passwordHash,
          isActive,
        },
      });

      const role = await tx.role.findUnique({
        where: { name: roleName },
      });
      if (!role) {
        throw new HttpError(
          500,
          `Rol «${roleName}» no configurado. Ejecute el seed de la base.`,
        );
      }

      await tx.userRole.create({
        data: { userId: user.id, roleId: role.id },
      });

      if (dto.userType === "STUDENT") {
        const studentCode =
          dto.studentCode ?? (await allocateUniqueStudentCode());
        await tx.student.create({
          data: {
            userId: user.id,
            studentCode,
            careerId: dto.careerId,
            academicStatus,
          },
        });
      }

      if (dto.userType === "TEACHER") {
        const employeeCode =
          dto.employeeCode ?? (await allocateUniqueEmployeeCode());
        await tx.teacher.create({
          data: {
            userId: user.id,
            employeeCode,
            department: dto.department ?? null,
          },
        });
      }

      return user;
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findById(id);
    return prisma.user.update({
      where: { id },
      data: dto,
    });
  }

  async softDelete(id: string) {
    await this.findById(id);
    return prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async toggleActive(id: string) {
    const user = await this.findById(id);

    // When activating a student, require all admission docs to be approved
    if (!user.isActive && user.userType === "STUDENT") {
      const student = await prisma.student.findFirst({
        where: { userId: id, deletedAt: null },
      });
      if (student) {
        const { admissionDocumentsService } = await import(
          "../admission-documents/admission-documents.service"
        );
        const allApproved = await admissionDocumentsService.allRequiredApproved(student.id);
        if (!allApproved) {
          throw new HttpError(
            400,
            "No se puede activar el estudiante: documentos de admisión pendientes o rechazados",
          );
        }
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    });

    // When activating a pending student, also set academic status to ACTIVE
    if (!user.isActive && user.userType === "STUDENT") {
      await prisma.student.updateMany({
        where: { userId: id, academicStatus: "PENDING" },
        data: { academicStatus: "ACTIVE" },
      });
    }

    return updated;
  }
}

export const usersService = new UsersService();
