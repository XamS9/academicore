import { z } from 'zod';

export const CreateContentItemDto = z.object({
  topicId: z.string().uuid(),
  title: z.string().min(1).max(200),
  type: z.enum(['LINK', 'TEXT', 'FILE_REF']),
  content: z.string().min(1),
  sortOrder: z.number().int().min(1),
});
export type CreateContentItemDto = z.infer<typeof CreateContentItemDto>;

export const UpdateContentItemDto = CreateContentItemDto.partial();
export type UpdateContentItemDto = z.infer<typeof UpdateContentItemDto>;
