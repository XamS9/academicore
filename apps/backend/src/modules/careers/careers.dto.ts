import { z } from "zod";

export const CreateCareerDto = z.object({
  name: z.string().min(1).max(200),
  /** Omit or empty: generated from name + sequence (same algorithm as GET suggest-code). */
  code: z.string().max(20).optional(),
  totalSemesters: z.number().int().min(1).max(20),
});
export type CreateCareerDto = z.infer<typeof CreateCareerDto>;

export const UpdateCareerDto = CreateCareerDto.partial();
export type UpdateCareerDto = z.infer<typeof UpdateCareerDto>;

export const AddCareerSubjectDto = z.object({
  subjectId: z.string().uuid(),
  semesterNumber: z.number().int().min(1).max(40),
  isMandatory: z.boolean().optional().default(true),
});
export type AddCareerSubjectDto = z.infer<typeof AddCareerSubjectDto>;

export const UpdateCareerSubjectDto = z.object({
  semesterNumber: z.number().int().min(1).max(40).optional(),
  isMandatory: z.boolean().optional(),
});
export type UpdateCareerSubjectDto = z.infer<typeof UpdateCareerSubjectDto>;
