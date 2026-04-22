import { describe, expect, it } from "vitest";
import { isAllRequiredAdmissionDocsApproved } from "./admission-docs-status";

describe("scanned admission documents (required types approval gate)", () => {
  it("returns false when any required type is missing or not approved", () => {
    expect(
      isAllRequiredAdmissionDocsApproved([
        { type: "ID_CARD", status: "APPROVED" },
        { type: "HIGH_SCHOOL_DIPLOMA", status: "PENDING" },
      ]),
    ).toBe(false);
  });

  it("returns true when every required type has an APPROVED row", () => {
    expect(
      isAllRequiredAdmissionDocsApproved([
        { type: "ID_CARD", status: "APPROVED" },
        { type: "HIGH_SCHOOL_DIPLOMA", status: "APPROVED" },
        { type: "PHOTO", status: "APPROVED" },
      ]),
    ).toBe(true);
  });
});
