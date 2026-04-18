import { z } from "zod";

const BaseUserFields = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6),
});

export const CreateUserDto = z.discriminatedUnion("userType", [
  BaseUserFields.extend({
    userType: z.literal("ADMIN"),
  }),
  BaseUserFields.extend({
    userType: z.literal("TEACHER"),
    employeeCode: z.string().min(1).max(50).optional(),
    department: z.string().max(150).optional().nullable(),
  }),
  BaseUserFields.extend({
    userType: z.literal("STUDENT"),
    careerId: z.string().uuid(),
    academicStatus: z
      .enum([
        "PENDING",
        "ACTIVE",
        "AT_RISK",
        "ELIGIBLE_FOR_GRADUATION",
        "SUSPENDED",
        "GRADUATED",
        "WITHDRAWN",
      ])
      .optional(),
    studentCode: z.string().min(1).max(50).optional(),
  }),
]);
export type CreateUserDto = z.infer<typeof CreateUserDto>;

export const UpdateUserDto = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  userType: z.enum(["STUDENT", "TEACHER", "ADMIN"]).optional(),
});
export type UpdateUserDto = z.infer<typeof UpdateUserDto>;
