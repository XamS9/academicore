import { z } from "zod";

export const CreateSubjectDto = z.object({
  name: z.string().min(1).max(200),
  /** Omit or empty: generated from name + sequence (same algorithm as GET suggest-code). */
  code: z.string().max(20).optional(),
  credits: z.number().int().min(1),
  tuitionAmount: z.number().nonnegative().nullable().optional(),
  prerequisiteIds: z.array(z.string().uuid()).optional(),
});
export type CreateSubjectDto = z.infer<typeof CreateSubjectDto>;

export const UpdateSubjectDto = CreateSubjectDto.partial();
export type UpdateSubjectDto = z.infer<typeof UpdateSubjectDto>;

export const AddPrerequisiteDto = z.object({
  prerequisiteId: z.string().uuid(),
});
export type AddPrerequisiteDto = z.infer<typeof AddPrerequisiteDto>;
