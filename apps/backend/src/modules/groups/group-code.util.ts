import { prisma } from "../../shared/prisma.client";
import { uppercaseLettersFromString } from "../../shared/entity-code.util";

/** Prefix from subject code or name: only chars that are uppercase in the source (Lu). */
export function groupCodePrefixFromSubject(subject: {
  name: string;
  code: string;
}): string {
  const fromCode = uppercaseLettersFromString(subject.code, 5);
  if (fromCode.length >= 2) return fromCode;

  const fromName = uppercaseLettersFromString(subject.name, 5);
  if (fromName.length >= 2) return fromName;

  if (fromCode.length === 1) return fromCode;
  if (fromName.length === 1) return fromName;

  return "GRP";
}

/**
 * Next unique `group_code` for (subject, period): PREFIX + sequence (1, 2, …).
 * Respects @@unique([subjectId, academicPeriodId, groupCode]) and VarChar(20).
 */
export async function allocateNextGroupCode(
  subjectId: string,
  academicPeriodId: string,
  subject: { name: string; code: string },
): Promise<string> {
  const basePrefix = groupCodePrefixFromSubject(subject);

  const count = await prisma.group.count({
    where: { subjectId, academicPeriodId },
  });

  for (let seq = count + 1; seq < count + 5000; seq++) {
    const suffix = String(seq);
    const maxPrefix = Math.max(1, 20 - suffix.length);
    const prefix = basePrefix.slice(0, maxPrefix);
    const candidate = `${prefix}${suffix}`;
    if (candidate.length > 20) continue;

    const clash = await prisma.group.findFirst({
      where: { subjectId, academicPeriodId, groupCode: candidate },
      select: { id: true },
    });
    if (!clash) return candidate;
  }

  throw new Error("Could not allocate unique group code");
}
