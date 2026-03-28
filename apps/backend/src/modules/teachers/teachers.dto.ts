import { z } from 'zod';

export const CreateTeacherDto = z.object({
  userId: z.string().uuid(),
  employeeCode: z.string().min(1).max(50),
  department: z.string().max(150).optional(),
});
export type CreateTeacherDto = z.infer<typeof CreateTeacherDto>;

export const UpdateTeacherDto = CreateTeacherDto.partial().omit({ userId: true });
export type UpdateTeacherDto = z.infer<typeof UpdateTeacherDto>;
