import { prisma } from "./prisma.client";

function stripDiacritics(input: string): string {
  return input.normalize("NFD").replace(/\p{M}/gu, "");
}

/**
 * Only letters that are already uppercase in the source string (Unicode Lu),
 * in order — e.g. "Prueba test Ingenieria" → "PI".
 */
export function uppercaseLettersFromString(
  input: string,
  maxLen: number,
): string {
  const s = stripDiacritics(input).trim();
  return (s.match(/\p{Lu}/gu) ?? []).join("").slice(0, maxLen);
}

/**
 * Prefix for generated codes: uppercase letters from the name only; if none, fallback.
 */
export function codePrefixFromName(
  name: string,
  maxPrefix: number,
  fallback: string,
): string {
  const letters = uppercaseLettersFromString(name, maxPrefix);
  if (letters.length > 0) return letters;
  return fallback.slice(0, maxPrefix);
}

async function allocateSequentialGlobalCode(
  basePrefix: string,
  maxTotalLen: number,
  isTaken: (code: string) => Promise<boolean>,
): Promise<string> {
  const prefix = basePrefix.slice(0, maxTotalLen);
  for (let seq = 1; seq < 100_000; seq++) {
    const suffix = String(seq);
    const maxP = Math.max(1, maxTotalLen - suffix.length);
    const p = prefix.slice(0, maxP);
    const candidate = `${p}${suffix}`;
    if (candidate.length > maxTotalLen) continue;
    if (!(await isTaken(candidate))) return candidate;
  }
  throw new Error("Could not allocate unique code");
}

/** Next unique `careers.code` from career name (PREFIX + sequence). */
export async function allocateUniqueCareerCode(name: string): Promise<string> {
  const base = codePrefixFromName(name, 6, "CAR");
  return allocateSequentialGlobalCode(base, 20, async (code) => {
    const row = await prisma.career.findFirst({
      where: { code, deletedAt: null },
      select: { id: true },
    });
    return !!row;
  });
}

/** Next unique `subjects.code` from subject name (PREFIX + sequence). */
export async function allocateUniqueSubjectCode(name: string): Promise<string> {
  const base = codePrefixFromName(name, 6, "MAT");
  return allocateSequentialGlobalCode(base, 20, async (code) => {
    const row = await prisma.subject.findFirst({
      where: { code, deletedAt: null },
      select: { id: true },
    });
    return !!row;
  });
}
