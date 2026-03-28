import { z } from 'zod';

export const CreateClassroomDto = z.object({
  name: z.string().min(1).max(50),
  building: z.string().max(100).optional(),
  capacity: z.number().int().min(1),
});
export type CreateClassroomDto = z.infer<typeof CreateClassroomDto>;

export const UpdateClassroomDto = CreateClassroomDto.partial();
export type UpdateClassroomDto = z.infer<typeof UpdateClassroomDto>;
