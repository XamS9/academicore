import type { Subject } from "@prisma/client";

export const VALID_CYCLES_PER_YEAR = [1, 2, 3, 4, 6, 12] as const;
export type CyclesPerYear = (typeof VALID_CYCLES_PER_YEAR)[number];

export function isValidCyclesPerYear(n: number): n is CyclesPerYear {
  return (VALID_CYCLES_PER_YEAR as readonly number[]).includes(n);
}

export function monthsInAcademicCycle(cyclesPerYear: CyclesPerYear): number {
  return 12 / cyclesPerYear;
}

/**
 * Per-period course charge for **open enrollment** and **monthly installment** totals:
 * always `credits × creditCost` (ignores `Subject.tuitionAmount`).
 */
export function creditBasedTuitionForSubject(
  subject: Pick<Subject, "credits">,
  creditCost: number,
): number {
  return Math.round(creditCost * subject.credits * 100) / 100;
}

/**
 * Per-period course charge for **tutoría / solicitud de tutoría** (UI and that flow):
 * fixed `tuitionAmount` when set, otherwise credits × `creditCost`.
 */
export function tuitionForSubject(
  subject: Pick<Subject, "credits" | "tuitionAmount">,
  creditCost: number,
): number {
  if (subject.tuitionAmount != null) {
    return Math.round(Number(subject.tuitionAmount) * 100) / 100;
  }
  return creditBasedTuitionForSubject(subject, creditCost);
}

/**
 * Split a monetary total (MXN-style) into `parts` amounts in cents so the sum matches exactly.
 */
export function splitCurrencyIntoNPieces(total: number, parts: number): number[] {
  if (parts <= 0) return [];
  const cents = Math.round(Math.max(0, total) * 100);
  const base = Math.floor(cents / parts);
  const out: number[] = Array(parts).fill(base);
  let rem = cents - base * parts;
  for (let i = out.length - 1; rem > 0 && i >= 0; i--, rem--) {
    out[i] += 1;
  }
  return out.map((c) => c / 100);
}
