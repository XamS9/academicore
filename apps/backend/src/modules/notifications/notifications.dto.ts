import { z } from 'zod';

export const NotificationQuerySchema = z.object({
  unreadOnly: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export type NotificationQuery = z.infer<typeof NotificationQuerySchema>;
