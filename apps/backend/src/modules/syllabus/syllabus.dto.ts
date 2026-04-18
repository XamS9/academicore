import { z } from "zod";

export const CreateSyllabusTopicDto = z.object({
  subjectId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
});
export type CreateSyllabusTopicDto = z.infer<typeof CreateSyllabusTopicDto>;

export const UpdateSyllabusTopicDto = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
});
export type UpdateSyllabusTopicDto = z.infer<typeof UpdateSyllabusTopicDto>;

export const ReorderSyllabusTopicsDto = z.object({
  orderedIds: z.array(z.string().uuid()).min(1),
});
export type ReorderSyllabusTopicsDto = z.infer<typeof ReorderSyllabusTopicsDto>;

export const MarkTopicProgressDto = z.object({
  topicId: z.string().uuid(),
  weekNumber: z.number().int().min(1).max(52),
  coveredAt: z.string().datetime().optional(),
  notes: z.string().max(1000).nullable().optional(),
});
export type MarkTopicProgressDto = z.infer<typeof MarkTopicProgressDto>;
