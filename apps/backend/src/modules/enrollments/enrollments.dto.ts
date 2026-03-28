import { z } from 'zod';

export const EnrollStudentDto = z.object({
  studentId: z.string().uuid(),
  groupId: z.string().uuid(),
  periodId: z.string().uuid(),
});
export type EnrollStudentDto = z.infer<typeof EnrollStudentDto>;

export const DropSubjectDto = z.object({
  enrollmentSubjectId: z.string().uuid(),
});
export type DropSubjectDto = z.infer<typeof DropSubjectDto>;
