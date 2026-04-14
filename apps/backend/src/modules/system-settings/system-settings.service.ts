import { Prisma } from "@prisma/client";
import { prisma } from "../../shared/prisma.client";
import { HttpError } from "../../shared/http-error";
import { UpdateSystemSettingsDto } from "./system-settings.dto";

export class SystemSettingsService {
  async get() {
    const settings = await prisma.systemSettings.findFirst();
    if (!settings) throw new HttpError(500, "System settings not configured");
    return settings;
  }

  async update(dto: UpdateSystemSettingsDto, userId: string) {
    const settings = await prisma.systemSettings.findFirst();
    if (!settings) throw new HttpError(500, "System settings not configured");

    const oldValues: Record<string, unknown> = {};
    const newValues: Record<string, unknown> = {};

    if (
      dto.passingGrade !== undefined &&
      Number(settings.passingGrade) !== dto.passingGrade
    ) {
      oldValues.passingGrade = Number(settings.passingGrade);
      newValues.passingGrade = dto.passingGrade;
    }
    if (
      dto.maxSubjectsPerEnrollment !== undefined &&
      settings.maxSubjectsPerEnrollment !== dto.maxSubjectsPerEnrollment
    ) {
      oldValues.maxSubjectsPerEnrollment = settings.maxSubjectsPerEnrollment;
      newValues.maxSubjectsPerEnrollment = dto.maxSubjectsPerEnrollment;
    }
    if (
      dto.maxEvaluationWeight !== undefined &&
      Number(settings.maxEvaluationWeight) !== dto.maxEvaluationWeight
    ) {
      oldValues.maxEvaluationWeight = Number(settings.maxEvaluationWeight);
      newValues.maxEvaluationWeight = dto.maxEvaluationWeight;
    }
    if (
      dto.atRiskThreshold !== undefined &&
      settings.atRiskThreshold !== dto.atRiskThreshold
    ) {
      oldValues.atRiskThreshold = settings.atRiskThreshold;
      newValues.atRiskThreshold = dto.atRiskThreshold;
    }

    const updated = await prisma.systemSettings.update({
      where: { id: settings.id },
      data: {
        ...(dto.passingGrade !== undefined && {
          passingGrade: dto.passingGrade,
        }),
        ...(dto.maxSubjectsPerEnrollment !== undefined && {
          maxSubjectsPerEnrollment: dto.maxSubjectsPerEnrollment,
        }),
        ...(dto.maxEvaluationWeight !== undefined && {
          maxEvaluationWeight: dto.maxEvaluationWeight,
        }),
        ...(dto.atRiskThreshold !== undefined && {
          atRiskThreshold: dto.atRiskThreshold,
        }),
        ...(dto.signatureImage1 !== undefined && {
          signatureImage1: dto.signatureImage1,
        }),
        ...(dto.signatureName1 !== undefined && {
          signatureName1: dto.signatureName1,
        }),
        ...(dto.signatureTitle1 !== undefined && {
          signatureTitle1: dto.signatureTitle1,
        }),
        ...(dto.signatureImage2 !== undefined && {
          signatureImage2: dto.signatureImage2,
        }),
        ...(dto.signatureName2 !== undefined && {
          signatureName2: dto.signatureName2,
        }),
        ...(dto.signatureTitle2 !== undefined && {
          signatureTitle2: dto.signatureTitle2,
        }),
        updatedBy: userId,
      },
    });

    if (Object.keys(newValues).length > 0) {
      await prisma.auditLog.create({
        data: {
          entityType: "system_settings",
          entityId: settings.id,
          action: "UPDATED",
          performedBy: userId,
          oldValues: oldValues as Prisma.InputJsonValue,
          newValues: newValues as Prisma.InputJsonValue,
        },
      });
    }

    return updated;
  }
}

export const systemSettingsService = new SystemSettingsService();
