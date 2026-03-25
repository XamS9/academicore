import { prisma } from '../../shared/prisma.client';
import { CreateEvaluationTypeDto } from './evaluation-types.dto';

class EvaluationTypesService {
  async findAll() {
    return prisma.evaluationType.findMany();
  }

  async create(dto: CreateEvaluationTypeDto) {
    return prisma.evaluationType.create({
      data: dto,
    });
  }
}

export const evaluationTypesService = new EvaluationTypesService();
