import { z } from 'zod';

export const CreateEvaluationDto = z.object({
  groupId: z.string().uuid(),
  evaluationTypeId: z.string().uuid(),
  name: z.string().min(1).max(200),
  weight: z.number().positive().max(100),
  maxScore: z.number().positive().default(100),
  dueDate: z.string().optional(),
});
export type CreateEvaluationDto = z.infer<typeof CreateEvaluationDto>;

export const UpdateEvaluationDto = CreateEvaluationDto.partial();
export type UpdateEvaluationDto = z.infer<typeof UpdateEvaluationDto>;
