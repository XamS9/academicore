import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  creditBasedTuitionForSubject,
  isValidCyclesPerYear,
  monthsInAcademicCycle,
  splitCurrencyIntoNPieces,
  tuitionForSubject,
} from "./academic-pricing";

describe("academic-pricing (global credit cost & per-course payment amount)", () => {
  it("creditBasedTuitionForSubject always uses credits × creditCost", () => {
    expect(creditBasedTuitionForSubject({ credits: 5 }, 500)).toBe(2500);
    expect(
      creditBasedTuitionForSubject({ credits: 6 }, 500),
    ).toBe(3000);
  });

  it("uses credits × creditCost when tuitionAmount is null", () => {
    expect(
      tuitionForSubject({ credits: 5, tuitionAmount: null }, 500),
    ).toBe(2500);
  });

  it("uses Subject.tuitionAmount when set (tutoría / solicitud de tutoría)", () => {
    expect(
      tuitionForSubject({ credits: 6, tuitionAmount: new Prisma.Decimal(3600) }, 500),
    ).toBe(3600);
  });

  it("rounds to 2 decimal places", () => {
    expect(
      tuitionForSubject({ credits: 3, tuitionAmount: null }, 33.33),
    ).toBe(99.99);
    expect(creditBasedTuitionForSubject({ credits: 3 }, 33.33)).toBe(99.99);
  });

  it("validates cycles-per-year options for installment counts", () => {
    expect(isValidCyclesPerYear(2)).toBe(true);
    expect(monthsInAcademicCycle(2)).toBe(6);
    expect(monthsInAcademicCycle(12)).toBe(1);
    expect(isValidCyclesPerYear(5)).toBe(false);
  });

  it("splits tuition total into equal installments without drift", () => {
    const parts = splitCurrencyIntoNPieces(9100, 6);
    expect(parts).toHaveLength(6);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(9100);
    const base = Math.floor((9100 * 100) / 6) / 100;
    expect(parts.every((p) => Math.abs(p - base) <= 0.02)).toBe(true);
  });
});
