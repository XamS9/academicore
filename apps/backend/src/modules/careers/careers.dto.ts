import { z } from "zod";

export const CreateCareerDto = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(20),
  totalSemesters: z.number().int().min(1).max(20),
});
export type CreateCareerDto = z.infer<typeof CreateCareerDto>;

export const UpdateCareerDto = CreateCareerDto.partial();
export type UpdateCareerDto = z.infer<typeof UpdateCareerDto>;
