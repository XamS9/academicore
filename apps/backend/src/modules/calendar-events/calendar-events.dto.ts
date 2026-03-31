import { z } from "zod";

export const CreateCalendarEventDto = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  eventType: z.enum(["HOLIDAY", "EXAM_WEEK", "DEADLINE", "OTHER"]),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  periodId: z.string().uuid().optional(),
});

export const UpdateCalendarEventDto = CreateCalendarEventDto.partial();

export type CreateCalendarEventInput = z.infer<typeof CreateCalendarEventDto>;
export type UpdateCalendarEventInput = z.infer<typeof UpdateCalendarEventDto>;
