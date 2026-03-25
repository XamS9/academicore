import { z } from 'zod';

export const UpsertGradeDto = z.object({
  evaluationId: z.string().uuid(),
  studentId: z.string().uuid(),
  score: z.number().min(0),
});
export type UpsertGradeDto = z.infer<typeof UpsertGradeDto>;

export const BulkUpsertGradesDto = z.object({
  grades: z.array(UpsertGradeDto),
});
export type BulkUpsertGradesDto = z.infer<typeof BulkUpsertGradesDto>;
