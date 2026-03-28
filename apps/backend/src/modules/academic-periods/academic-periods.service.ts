import { prisma } from '../../shared/prisma.client';
import { HttpError } from '../../shared/http-error';
import { CreateAcademicPeriodDto, UpdateAcademicPeriodDto } from './academic-periods.dto';

class AcademicPeriodsService {
  async findAll() {
    return prisma.academicPeriod.findMany();
  }

  async findActive() {
    return prisma.academicPeriod.findMany({
      where: { isActive: true },
    });
  }

  async findById(id: string) {
    const period = await prisma.academicPeriod.findUnique({
      where: { id },
    });
    if (!period) throw new HttpError(404, 'Academic period not found');
    return period;
  }

  async create(dto: CreateAcademicPeriodDto) {
    return prisma.academicPeriod.create({
      data: {
        name: dto.name,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        enrollmentOpen: dto.enrollmentOpen,
      },
    });
  }

  async update(id: string, dto: UpdateAcademicPeriodDto) {
    await this.findById(id);
    return prisma.academicPeriod.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.startDate !== undefined ? { startDate: new Date(dto.startDate) } : {}),
        ...(dto.endDate !== undefined ? { endDate: new Date(dto.endDate) } : {}),
        ...(dto.enrollmentOpen !== undefined ? { enrollmentOpen: dto.enrollmentOpen } : {}),
      },
    });
  }

  async toggleEnrollment(id: string) {
    const period = await this.findById(id);
    return prisma.academicPeriod.update({
      where: { id },
      data: { enrollmentOpen: !period.enrollmentOpen },
    });
  }

  async toggleActive(id: string) {
    const period = await this.findById(id);
    return prisma.academicPeriod.update({
      where: { id },
      data: { isActive: !period.isActive },
    });
  }
}

export const academicPeriodsService = new AcademicPeriodsService();
