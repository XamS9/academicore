import type { AcademicPeriod, PrismaClient } from "@prisma/client";

export function utcDayNumber(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function isPastEnrollmentPhaseEnd(end: Date | null, at: Date = new Date()): boolean {
  if (!end) return false;
  return utcDayNumber(at) > utcDayNumber(end);
}

export function isBeforeEnrollmentPhaseStart(
  start: Date | null,
  at: Date = new Date(),
): boolean {
  if (!start) return false;
  return utcDayNumber(at) < utcDayNumber(start);
}

/**
 * Whether students may self-enroll in groups: flag + OPEN status + optional phase date window (UTC calendar days).
 */
export function effectiveEnrollmentOpen(
  period: Pick<
    AcademicPeriod,
    "enrollmentOpen" | "status" | "enrollmentPhaseStartDate" | "enrollmentPhaseEndDate"
  >,
  at: Date = new Date(),
): boolean {
  if (period.status !== "OPEN") return false;
  if (!period.enrollmentOpen) return false;
  if (isBeforeEnrollmentPhaseStart(period.enrollmentPhaseStartDate, at)) return false;
  if (isPastEnrollmentPhaseEnd(period.enrollmentPhaseEndDate, at)) return false;
  return true;
}

/**
 * Persists enrollment_open = false when the phase end date is strictly before the current UTC calendar day.
 */
export async function syncEnrollmentPhaseAutoClose(
  db: PrismaClient,
  at: Date = new Date(),
): Promise<void> {
  const periods = await db.academicPeriod.findMany({
    where: {
      enrollmentOpen: true,
      status: "OPEN",
      enrollmentPhaseEndDate: { not: null },
    },
    select: { id: true, enrollmentPhaseEndDate: true },
  });
  for (const p of periods) {
    if (p.enrollmentPhaseEndDate && isPastEnrollmentPhaseEnd(p.enrollmentPhaseEndDate, at)) {
      await db.academicPeriod.update({
        where: { id: p.id },
        data: { enrollmentOpen: false },
      });
    }
  }
}
