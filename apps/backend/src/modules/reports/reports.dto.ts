import { z } from "zod";

export const ReportQuerySchema = z.object({
  periodId: z.string().uuid().optional(),
  careerId: z.string().uuid().optional(),
});

export type ReportQuery = z.infer<typeof ReportQuerySchema>;
