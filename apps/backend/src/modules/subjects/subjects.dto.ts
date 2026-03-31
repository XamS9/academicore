import { z } from "zod";

export const CreateSubjectDto = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(20),
  credits: z.number().int().min(1),
});
export type CreateSubjectDto = z.infer<typeof CreateSubjectDto>;

export const UpdateSubjectDto = CreateSubjectDto.partial();
export type UpdateSubjectDto = z.infer<typeof UpdateSubjectDto>;

export const AddPrerequisiteDto = z.object({
  prerequisiteId: z.string().uuid(),
});
export type AddPrerequisiteDto = z.infer<typeof AddPrerequisiteDto>;
