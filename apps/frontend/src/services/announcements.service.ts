import { api } from "./api";

export interface AnnouncementDto {
  id: string;
  title: string;
  body: string;
  audience: string;
  targetId: string | null;
  publishedAt: string;
  author: { firstName: string; lastName: string };
}

export interface PaginatedAnnouncements {
  data: AnnouncementDto[];
  total: number;
  page: number;
  pageSize: number;
}

export const announcementsService = {
  getAll: (params?: { page?: number; pageSize?: number }) =>
    api
      .get<PaginatedAnnouncements>("/announcements", { params })
      .then((r) => r.data),

  getMy: (params?: { page?: number; pageSize?: number }) =>
    api
      .get<PaginatedAnnouncements>("/announcements/my", { params })
      .then((r) => r.data),

  getById: (id: string) =>
    api.get<AnnouncementDto>(`/announcements/${id}`).then((r) => r.data),

  create: (data: unknown) =>
    api.post<AnnouncementDto>("/announcements", data).then((r) => r.data),

  update: (id: string, data: unknown) =>
    api.patch<AnnouncementDto>(`/announcements/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/announcements/${id}`).then((r) => r.data),
};
