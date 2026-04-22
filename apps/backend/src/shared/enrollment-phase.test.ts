import { describe, it, expect } from "vitest";
import {
  effectiveEnrollmentOpen,
  isBeforeEnrollmentPhaseStart,
  isPastEnrollmentPhaseEnd,
  utcDayNumber,
} from "./enrollment-phase";

describe("enrollment-phase", () => {
  it("compares UTC calendar days", () => {
    const a = new Date("2026-04-20T12:00:00.000Z");
    const b = new Date("2026-04-20T23:59:59.000Z");
    expect(utcDayNumber(a)).toBe(utcDayNumber(b));
  });

  it("treats phase end as inclusive for the end day", () => {
    const end = new Date("2026-04-20");
    expect(isPastEnrollmentPhaseEnd(end, new Date("2026-04-20T15:00:00.000Z"))).toBe(false);
    expect(isPastEnrollmentPhaseEnd(end, new Date("2026-04-21T00:00:00.000Z"))).toBe(true);
  });

  it("blocks before phase start when flag is open", () => {
    const start = new Date("2026-05-01");
    expect(
      effectiveEnrollmentOpen(
        {
          enrollmentOpen: true,
          status: "OPEN",
          enrollmentPhaseStartDate: start,
          enrollmentPhaseEndDate: null,
        },
        new Date("2026-04-20"),
      ),
    ).toBe(false);
    expect(
      effectiveEnrollmentOpen(
        {
          enrollmentOpen: true,
          status: "OPEN",
          enrollmentPhaseStartDate: start,
          enrollmentPhaseEndDate: null,
        },
        new Date("2026-05-01"),
      ),
    ).toBe(true);
  });

  it("isBeforeEnrollmentPhaseStart", () => {
    expect(isBeforeEnrollmentPhaseStart(new Date("2026-05-01"), new Date("2026-04-30"))).toBe(
      true,
    );
    expect(isBeforeEnrollmentPhaseStart(null, new Date())).toBe(false);
  });
});
