import { z } from "zod";

export const GroupDeliveryModeZ = z.enum(["ON_SITE", "VIRTUAL", "HYBRID"]);

export const CreateGroupDto = z.object({
  subjectId: z.string().uuid(),
  academicPeriodId: z.string().uuid(),
  teacherId: z.string().uuid(),
  /** Omit or leave empty to auto-generate from subject code/name + sequence. */
  groupCode: z.string().max(20).optional(),
  maxStudents: z.number().int().min(1),
  deliveryMode: GroupDeliveryModeZ.optional(),
});
export type CreateGroupDto = z.infer<typeof CreateGroupDto>;

export const UpdateGroupDto = z.object({
  groupCode: z.string().min(1).max(20).optional(),
  maxStudents: z.number().int().min(1).optional(),
  deliveryMode: GroupDeliveryModeZ.optional(),
});
export type UpdateGroupDto = z.infer<typeof UpdateGroupDto>;

export const AssignClassroomDto = z.object({
  classroomId: z.string().uuid(),
  dayOfWeek: z.number().int().min(1).max(7),
  startTime: z.string(),
  endTime: z.string(),
});
export type AssignClassroomDto = z.infer<typeof AssignClassroomDto>;
