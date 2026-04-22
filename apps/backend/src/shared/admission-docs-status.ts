import { REQUIRED_ADMISSION_DOC_TYPES } from "./admission-docs";

/** Pure check used by admission flow and tests (scanned documents gate). */
export function isAllRequiredAdmissionDocsApproved(
  docs: { type: string; status: string }[],
): boolean {
  const approvedByType = new Set(
    docs.filter((d) => d.status === "APPROVED").map((d) => d.type),
  );
  return REQUIRED_ADMISSION_DOC_TYPES.every((t) => approvedByType.has(t));
}
