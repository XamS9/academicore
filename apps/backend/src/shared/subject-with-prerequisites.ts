import type { Prisma } from "@prisma/client";

/** Include prerequisite subjects (id, code, name) when loading a `Subject` via `include`. */
export const subjectWithPrerequisiteSubjectsInclude: Prisma.SubjectInclude = {
  prerequisites: {
    include: {
      prerequisite: { select: { id: true, code: true, name: true } },
    },
  },
};

/** Add to `subject: { select: { … } }` to return the same prerequisite nesting. */
export const subjectPrerequisitesSelect = {
  prerequisites: {
    select: {
      prerequisite: { select: { id: true, code: true, name: true } },
    },
  },
} as const;
