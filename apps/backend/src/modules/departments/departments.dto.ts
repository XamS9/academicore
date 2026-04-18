import { z } from "zod";

export const CreateDepartmentDto = z.object({
  name: z.string().trim().min(1).max(150),
});
export type CreateDepartmentDto = z.infer<typeof CreateDepartmentDto>;

export const UpdateDepartmentDto = z.object({
  name: z.string().trim().min(1).max(150),
});
export type UpdateDepartmentDto = z.infer<typeof UpdateDepartmentDto>;
