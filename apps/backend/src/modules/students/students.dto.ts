import { z } from 'zod';

export const CreateStudentDto = z.object({
  userId: z.string().uuid(),
  studentCode: z.string().min(1).max(50),
  careerId: z.string().uuid(),
  enrollmentDate: z.string().optional(),
});
export type CreateStudentDto = z.infer<typeof CreateStudentDto>;

export const UpdateStudentDto = z.object({
  careerId: z.string().uuid().optional(),
  academicStatus: z
    .enum(['ACTIVE', 'AT_RISK', 'ELIGIBLE_FOR_GRADUATION', 'SUSPENDED', 'GRADUATED', 'WITHDRAWN'])
    .optional(),
});
export type UpdateStudentDto = z.infer<typeof UpdateStudentDto>;
