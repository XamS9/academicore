import { z } from "zod";

export const CreateGroupDto = z.object({
  subjectId: z.string().uuid(),
  academicPeriodId: z.string().uuid(),
  teacherId: z.string().uuid(),
  groupCode: z.string().min(1).max(20),
  maxStudents: z.number().int().min(1),
});
export type CreateGroupDto = z.infer<typeof CreateGroupDto>;

export const UpdateGroupDto = CreateGroupDto.partial();
export type UpdateGroupDto = z.infer<typeof UpdateGroupDto>;

export const AssignClassroomDto = z.object({
  classroomId: z.string().uuid(),
  dayOfWeek: z.number().int().min(1).max(7),
  startTime: z.string(),
  endTime: z.string(),
});
export type AssignClassroomDto = z.infer<typeof AssignClassroomDto>;
