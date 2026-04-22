import { z } from "zod";

/** studentId optional for self-enrollment: resolved from JWT when caller is STUDENT. */
export const EnrollStudentDto = z.object({
  studentId: z.string().uuid().optional(),
  groupId: z.string().uuid(),
  periodId: z.string().uuid(),
});
export type EnrollStudentDto = z.infer<typeof EnrollStudentDto>;

export const DropSubjectDto = z.object({
  enrollmentSubjectId: z.string().uuid(),
});
export type DropSubjectDto = z.infer<typeof DropSubjectDto>;

export const CreateTuitionRequestDto = z.object({
  subjectId: z.string().uuid(),
  groupId: z.string().uuid(),
  studentNote: z.string().max(500).optional(),
});
export type CreateTuitionRequestDto = z.infer<typeof CreateTuitionRequestDto>;
