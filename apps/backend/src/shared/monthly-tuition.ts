import type { PrismaClient } from "@prisma/client";
import { prisma } from "./prisma.client";
import {
  creditBasedTuitionForSubject,
  isValidCyclesPerYear,
  monthsInAcademicCycle,
  splitCurrencyIntoNPieces,
  tuitionForSubject,
  type CyclesPerYear,
  VALID_CYCLES_PER_YEAR,
} from "./academic-pricing";

export type { CyclesPerYear };
export {
  VALID_CYCLES_PER_YEAR,
  isValidCyclesPerYear,
  monthsInAcademicCycle,
  tuitionForSubject,
  creditBasedTuitionForSubject,
};

type Db = PrismaClient | Pick<
  PrismaClient,
  | "systemSettings"
  | "academicPeriod"
  | "enrollmentSubject"
  | "feeConcept"
  | "studentFee"
  | "tuitionGroupRequest"
>;

function buildDueDates(periodStart: Date, count: number): Date[] {
  const start = new Date(periodStart);
  const out: Date[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setMonth(d.getMonth() + i);
    out.push(d);
  }
  return out;
}

export async function isInscriptionRequirementMet(
  db: Db,
  studentId: string,
  periodId: string,
): Promise<boolean> {
  const settings = await db.systemSettings.findFirst();
  if (!settings) return false;
  if (Number(settings.inscriptionFee) <= 0) return true;
  const paid = await db.studentFee.findFirst({
    where: {
      studentId,
      periodId,
      status: "PAID",
      feeConcept: { name: { contains: "inscripci", mode: "insensitive" } },
    },
  });
  return !!paid;
}

/**
 * (Re)generates monthly tuition charges for a period: per enrolled subject, uses
 * `tuitionForSubject` (fixed `Subject.tuitionAmount` when set) if the student has a
 * PENDING or APPROVED tutoría request for that subject in the period; otherwise
 * `creditBasedTuitionForSubject` (credits × credit cost). Split into 12/cyclesPerYear installments.
 * Respects already PAID installments; recreates PENDING ones with updated amounts.
 * No-op if inscription (when required) is not yet paid, or there are no enrolled subjects.
 */
export async function syncMonthlyTuitionInstallments(
  db: Db,
  studentId: string,
  periodId: string,
): Promise<void> {
  const settings = await db.systemSettings.findFirst();
  if (!settings) return;
  const cy = settings.cyclesPerYear ?? 2;
  if (!isValidCyclesPerYear(cy)) return;
  const months = monthsInAcademicCycle(cy);
  const creditCost = Number(settings.creditCost ?? 0);

  const met = await isInscriptionRequirementMet(db, studentId, periodId);
  if (!met) return;

  const period = await db.academicPeriod.findUnique({ where: { id: periodId } });
  if (!period) return;

  const rows = await db.enrollmentSubject.findMany({
    where: {
      status: "ENROLLED",
      enrollment: { studentId, academicPeriodId: periodId },
    },
    include: { group: { include: { subject: true } } },
  });

  const tutorPricingSubjects = await db.tuitionGroupRequest.findMany({
    where: {
      studentId,
      academicPeriodId: periodId,
      status: { in: ["PENDING", "APPROVED"] },
    },
    select: { subjectId: true },
  });
  const useTutorPricingForSubject = new Set(tutorPricingSubjects.map((t) => t.subjectId));

  let totalTuition = 0;
  for (const r of rows) {
    const line =
      useTutorPricingForSubject.has(r.group.subjectId) ?
        tuitionForSubject(r.group.subject, creditCost)
      : creditBasedTuitionForSubject(r.group.subject, creditCost);
    totalTuition += line;
  }
  totalTuition = Math.round(totalTuition * 100) / 100;

  let mensualidadConcept = await db.feeConcept.findFirst({
    where: { isActive: true, name: { contains: "mensualidad", mode: "insensitive" } },
  });
  if (!mensualidadConcept) {
    mensualidadConcept = await db.feeConcept.create({
      data: {
        name: "Mensualidad académica",
        amount: 0,
        description: "Cuota mensual del período (matrícula fraccionada)",
      },
    });
  }

  const dueDates = buildDueDates(period.startDate, months);

  if (totalTuition <= 0) {
    await db.studentFee.deleteMany({
      where: {
        studentId,
        periodId,
        feeConceptId: mensualidadConcept.id,
        status: "PENDING",
        installmentNumber: { not: null },
      },
    });
    return;
  }

  const existing = await db.studentFee.findMany({
    where: {
      studentId,
      periodId,
      feeConceptId: mensualidadConcept.id,
      installmentNumber: { not: null },
    },
    orderBy: { installmentNumber: "asc" },
  });

  const paid = existing.filter((f: { status: string }) => f.status === "PAID");
  const paidSum = paid.reduce((s: number, f: { amount: unknown }) => s + Number(f.amount), 0);

  const paidRounded = Math.round(paidSum * 100) / 100;
  let remainingTotal = Math.round((totalTuition - paidRounded) * 100) / 100;
  if (remainingTotal < 0) remainingTotal = 0;

  const paidCount = paid.length;
  if (paidCount >= months) {
    return;
  }

  const remainingSlots = months - paidCount;

  await db.studentFee.deleteMany({
    where: {
      studentId,
      periodId,
      feeConceptId: mensualidadConcept.id,
      status: "PENDING",
      installmentNumber: { not: null },
    },
  });

  const pendingAmounts = splitCurrencyIntoNPieces(remainingTotal, remainingSlots);

  const startInstallment = paidCount + 1;

  for (let i = 0; i < pendingAmounts.length; i++) {
    const amt = pendingAmounts[i];
    if (amt <= 0) continue;
    const instNumber = startInstallment + i;
    const dueIx = instNumber - 1;
    if (dueIx < 0 || dueIx >= dueDates.length) continue;

    await db.studentFee.create({
      data: {
        studentId,
        periodId,
        feeConceptId: mensualidadConcept.id,
        amount: amt,
        dueDate: dueDates[dueIx],
        installmentNumber: instNumber,
      },
    });
  }
}

export async function syncMonthlyTuitionInstallmentsGlobal(
  studentId: string,
  periodId: string,
): Promise<void> {
  await syncMonthlyTuitionInstallments(prisma, studentId, periodId);
}
