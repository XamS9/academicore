import { z } from "zod";

export const CreateAnnouncementDto = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  audience: z.enum(["ALL", "CAREER", "GROUP"]),
  targetId: z.string().uuid().optional(),
});

export const UpdateAnnouncementDto = z.object({
  title: z.string().min(1).max(200).optional(),
  body: z.string().min(1).optional(),
});

export type CreateAnnouncementInput = z.infer<typeof CreateAnnouncementDto>;
export type UpdateAnnouncementInput = z.infer<typeof UpdateAnnouncementDto>;

/** Query params for `GET /announcements` and `GET /announcements/my`. */
export const AnnouncementListQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type AnnouncementListQuery = z.infer<typeof AnnouncementListQueryDto>;
