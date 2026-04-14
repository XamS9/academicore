import { z } from "zod";

export const CreateStudentSubmissionSchema = z.object({
  /** Optional for students; resolved from JWT. Required for admin/teacher on behalf of student. */
  studentId: z.string().uuid().optional(),
  evaluationId: z.string().uuid(),
  title: z.string().min(1).max(255),
  type: z.enum(["LINK", "TEXT", "FILE_REF"]),
  content: z.string().min(1),
  fileKey: z.string().max(500).optional(),
  fileName: z.string().max(255).optional(),
  fileSize: z.number().int().positive().optional(),
  fileMimeType: z.string().max(100).optional(),
});

export const UpdateStudentSubmissionSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  type: z.enum(["LINK", "TEXT", "FILE_REF"]).optional(),
  content: z.string().min(1).optional(),
  fileKey: z.string().max(500).nullable().optional(),
  fileName: z.string().max(255).nullable().optional(),
  fileSize: z.number().int().positive().nullable().optional(),
  fileMimeType: z.string().max(100).nullable().optional(),
});

export type CreateStudentSubmissionDto = z.infer<typeof CreateStudentSubmissionSchema>;
export type UpdateStudentSubmissionDto = z.infer<typeof UpdateStudentSubmissionSchema>;
