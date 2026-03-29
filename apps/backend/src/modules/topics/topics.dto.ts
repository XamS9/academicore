import { z } from 'zod';

export const CreateTopicDto = z.object({
  groupId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().min(1),
});
export type CreateTopicDto = z.infer<typeof CreateTopicDto>;

export const UpdateTopicDto = CreateTopicDto.partial();
export type UpdateTopicDto = z.infer<typeof UpdateTopicDto>;

export const ReorderTopicsDto = z.object({
  orderedIds: z.array(z.string().uuid()).min(1),
});
export type ReorderTopicsDto = z.infer<typeof ReorderTopicsDto>;
