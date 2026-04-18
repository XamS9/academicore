import { allocateUniqueSubjectCode } from "../../shared/entity-code.util";
import { prisma } from "../../shared/prisma.client";
import { HttpError } from "../../shared/http-error";
import { CreateSubjectDto, UpdateSubjectDto } from "./subjects.dto";

class SubjectsService {
  private async assertCreditsWithinPolicy(credits: number) {
    const s = await prisma.systemSettings.findFirst();
    const max = s?.maxCreditsPerSubject ?? 24;
    if (credits > max) {
      throw new HttpError(
        400,
        `Los créditos de la materia no pueden ser mayores a ${max} (límite en Configuración del sistema).`,
      );
    }
  }

  async findAll() {
    return prisma.subject.findMany({
      where: { deletedAt: null },
      include: {
        prerequisites: {
          include: { prerequisite: true },
        },
      },
      orderBy: { code: "asc" },
    });
  }

  async findById(id: string) {
    const subject = await prisma.subject.findFirst({
      where: { id, deletedAt: null },
      include: {
        prerequisites: {
          include: { prerequisite: true },
        },
        isPrereqOf: {
          include: { subject: true },
        },
      },
    });
    if (!subject) throw new HttpError(404, "Subject not found");
    return subject;
  }

  async create(dto: CreateSubjectDto) {
    const { code: rawCode, prerequisiteIds, tuitionAmount, ...rest } = dto;
    await this.assertCreditsWithinPolicy(rest.credits);
    const trimmed = rawCode?.trim();
    const code =
      trimmed && trimmed.length > 0
        ? trimmed
        : await allocateUniqueSubjectCode(dto.name);

    const created = await prisma.subject.create({
      data: {
        ...rest,
        code,
        tuitionAmount: tuitionAmount ?? null,
      },
    });

    if (prerequisiteIds && prerequisiteIds.length > 0) {
      await this.syncPrerequisites(created.id, prerequisiteIds);
    }

    return this.findById(created.id);
  }

  async suggestCode(name: string) {
    const trimmed = name.trim();
    if (trimmed.length < 1) {
      throw new HttpError(400, "Nombre requerido para sugerir código");
    }
    const code = await allocateUniqueSubjectCode(trimmed);
    return { code };
  }

  async update(id: string, dto: UpdateSubjectDto) {
    await this.findById(id);
    const { prerequisiteIds, tuitionAmount, code: _code, ...rest } = dto;
    if (rest.credits !== undefined) {
      await this.assertCreditsWithinPolicy(rest.credits);
    }

    await prisma.subject.update({
      where: { id },
      data: {
        ...rest,
        ...(tuitionAmount !== undefined ? { tuitionAmount } : {}),
      },
    });

    if (prerequisiteIds !== undefined) {
      await this.syncPrerequisites(id, prerequisiteIds);
    }

    return this.findById(id);
  }

  async softDelete(id: string) {
    await this.findById(id);
    return prisma.subject.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async addPrerequisite(subjectId: string, prerequisiteId: string) {
    if (subjectId === prerequisiteId) {
      throw new HttpError(400, "Una materia no puede ser prerrequisito de sí misma");
    }
    await this.assertNoCycle(subjectId, [prerequisiteId]);
    return prisma.subjectPrerequisite.create({
      data: { subjectId, prerequisiteId },
    });
  }

  async removePrerequisite(subjectId: string, prerequisiteId: string) {
    const existing = await prisma.subjectPrerequisite.findFirst({
      where: { subjectId, prerequisiteId },
    });
    if (!existing)
      throw new HttpError(404, "Prerequisite relationship not found");
    return prisma.subjectPrerequisite.delete({
      where: { id: existing.id },
    });
  }

  /**
   * Replace the prerequisite set of `subjectId` with `prerequisiteIds`.
   * Rejects self-reference and cycles.
   */
  private async syncPrerequisites(subjectId: string, prerequisiteIds: string[]) {
    const unique = Array.from(new Set(prerequisiteIds));
    if (unique.includes(subjectId)) {
      throw new HttpError(400, "Una materia no puede ser prerrequisito de sí misma");
    }

    // Validate that all referenced subjects exist
    if (unique.length > 0) {
      const found = await prisma.subject.findMany({
        where: { id: { in: unique }, deletedAt: null },
        select: { id: true },
      });
      if (found.length !== unique.length) {
        throw new HttpError(400, "Uno o más prerrequisitos no existen");
      }
    }

    await this.assertNoCycle(subjectId, unique);

    await prisma.$transaction([
      prisma.subjectPrerequisite.deleteMany({ where: { subjectId } }),
      ...unique.map((prerequisiteId) =>
        prisma.subjectPrerequisite.create({
          data: { subjectId, prerequisiteId },
        }),
      ),
    ]);
  }

  /**
   * Reject cycles: if any of `candidatePrereqs` (or their transitive prereqs)
   * eventually depend on `subjectId`, adding them would create a cycle.
   */
  private async assertNoCycle(subjectId: string, candidatePrereqs: string[]) {
    if (candidatePrereqs.length === 0) return;

    const visited = new Set<string>();
    const queue = [...candidatePrereqs];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === subjectId) {
        throw new HttpError(400, "Prerrequisitos crean un ciclo");
      }
      if (visited.has(current)) continue;
      visited.add(current);

      const upstream = await prisma.subjectPrerequisite.findMany({
        where: { subjectId: current },
        select: { prerequisiteId: true },
      });
      for (const u of upstream) queue.push(u.prerequisiteId);
    }
  }
}

export const subjectsService = new SubjectsService();
