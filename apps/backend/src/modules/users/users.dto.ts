import { z } from "zod";

export const CreateUserDto = z.object({
  userType: z.enum(["STUDENT", "TEACHER", "ADMIN"]),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6),
});
export type CreateUserDto = z.infer<typeof CreateUserDto>;

export const UpdateUserDto = CreateUserDto.partial().omit({ password: true });
export type UpdateUserDto = z.infer<typeof UpdateUserDto>;
