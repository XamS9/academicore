import { prisma } from "../../shared/prisma.client";
import { HttpError } from "../../shared/http-error";
import { CreateEvaluationDto, UpdateEvaluationDto } from "./evaluations.dto";

export class EvaluationsService {
  private async getMaxWeight(): Promise<number> {
    const settings = await prisma.systemSettings.findFirst();
    return settings ? Number(settings.maxEvaluationWeight) : 100;
  }

  async findByGroup(groupId: string) {
    return prisma.evaluation.findMany({
      where: { groupId },
      include: { evaluationType: true },
      orderBy: { createdAt: "asc" },
    });
  }

  async findById(id: string) {
    const evaluation = await prisma.evaluation.findUnique({
      where: { id },
      include: { evaluationType: true },
    });
    if (!evaluation) throw new HttpError(404, "Evaluation not found");
    return evaluation;
  }

  async validateWeightSum(
    groupId: string,
    excludeId?: string,
  ): Promise<number> {
    const evaluations = await prisma.evaluation.findMany({
      where: {
        groupId,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { weight: true },
    });
    return evaluations.reduce(
      (sum: number, e: { weight: unknown }) => sum + Number(e.weight),
      0,
    );
  }

  async create(dto: CreateEvaluationDto) {
    const currentSum = await this.validateWeightSum(dto.groupId);
    const maxWeight = await this.getMaxWeight();
    if (currentSum + dto.weight > maxWeight) {
      throw new HttpError(
        400,
        `Total weight would exceed ${maxWeight}. Current sum: ${currentSum}, attempted addition: ${dto.weight}`,
      );
    }
    return prisma.evaluation.create({
      data: {
        groupId: dto.groupId,
        evaluationTypeId: dto.evaluationTypeId,
        name: dto.name,
        weight: dto.weight,
        maxScore: dto.maxScore,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      },
      include: { evaluationType: true },
    });
  }

  async update(id: string, dto: UpdateEvaluationDto) {
    const existing = await prisma.evaluation.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Evaluation not found");

    if (dto.weight !== undefined) {
      const currentSum = await this.validateWeightSum(existing.groupId, id);
      const maxWeight = await this.getMaxWeight();
      if (currentSum + dto.weight > maxWeight) {
        throw new HttpError(
          400,
          `Total weight would exceed ${maxWeight}. Current sum (excluding this): ${currentSum}, attempted weight: ${dto.weight}`,
        );
      }
    }

    return prisma.evaluation.update({
      where: { id },
      data: {
        ...(dto.groupId !== undefined && { groupId: dto.groupId }),
        ...(dto.evaluationTypeId !== undefined && {
          evaluationTypeId: dto.evaluationTypeId,
        }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.weight !== undefined && { weight: dto.weight }),
        ...(dto.maxScore !== undefined && { maxScore: dto.maxScore }),
        ...(dto.dueDate !== undefined && {
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        }),
      },
      include: { evaluationType: true },
    });
  }

  async delete(id: string) {
    const existing = await prisma.evaluation.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Evaluation not found");
    return prisma.evaluation.delete({ where: { id } });
  }
}

export const evaluationsService = new EvaluationsService();
