import Typography from "@mui/material/Typography";

export type PrerequisiteSubjectRef = { id: string; code: string; name: string };

type PrerequisiteRow =
  | { prerequisite: PrerequisiteSubjectRef }
  | (PrerequisiteSubjectRef & { met?: boolean });

/** Normalize API shapes: nested `prerequisite` (Prisma) or flat `{ id, code, name }` (e.g. self-enroll). */
export function listPrerequisiteSubjects(subject: {
  prerequisites?: PrerequisiteRow[];
}): PrerequisiteSubjectRef[] {
  const raw = subject.prerequisites ?? [];
  return raw.map((p) => {
    if ("prerequisite" in p && p.prerequisite) return p.prerequisite;
    const flat = p as PrerequisiteSubjectRef & { met?: boolean };
    return { id: flat.id, code: flat.code, name: flat.name };
  });
}

export function formatPrerequisitesLine(subjects: PrerequisiteSubjectRef[]): string {
  if (!subjects.length) return "";
  return subjects.map((s) => `${s.code} — ${s.name}`).join(" · ");
}

export function SubjectPrerequisitesCaption({
  subject,
  sx,
}: {
  subject: { prerequisites?: PrerequisiteRow[] };
  sx?: object;
}) {
  const line = formatPrerequisitesLine(listPrerequisiteSubjects(subject));
  if (!line) return null;
  return (
    <Typography
      variant="caption"
      color="text.secondary"
      display="block"
      sx={{ mt: 0.25, ...sx }}
    >
      Prerrequisitos: {line}
    </Typography>
  );
}
