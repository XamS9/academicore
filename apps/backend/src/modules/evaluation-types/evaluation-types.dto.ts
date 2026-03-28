import { z } from 'zod';

export const CreateEvaluationTypeDto = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(255).optional(),
});
export type CreateEvaluationTypeDto = z.infer<typeof CreateEvaluationTypeDto>;
