import bcrypt from 'bcryptjs';
import { prisma } from '../../shared/prisma.client';
import { HttpError } from '../../shared/http-error';
import { CreateUserDto, UpdateUserDto } from './users.dto';

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
    if (!user) throw new HttpError(404, 'User not found');
    return user;
  }

  async create(dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    return prisma.user.create({
      data: {
        userType: dto.userType,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        passwordHash,
      },
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
    return prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    });
  }
}

export const usersService = new UsersService();
