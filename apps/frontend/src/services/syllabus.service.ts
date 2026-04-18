import { api } from "./api";

export interface SyllabusTopic {
  id: string;
  subjectId: string;
  sortOrder: number;
  title: string;
  description: string | null;
}

export interface TopicProgress {
  id: string;
  groupId: string;
  topicId: string;
  teacherId: string;
  coveredAt: string;
  weekNumber: number;
  notes: string | null;
}

export interface TopicWithProgress extends SyllabusTopic {
  progress: TopicProgress | null;
}

export const syllabusService = {
  listBySubject: (subjectId: string): Promise<SyllabusTopic[]> =>
    api.get(`/syllabus/subjects/${subjectId}/topics`).then((r) => r.data),

  createTopic: (subjectId: string, data: { title: string; description?: string | null }) =>
    api.post(`/syllabus/subjects/${subjectId}/topics`, data).then((r) => r.data),

  updateTopic: (id: string, data: { title?: string; description?: string | null }) =>
    api.put(`/syllabus/topics/${id}`, data).then((r) => r.data),

  deleteTopic: (id: string) =>
    api.delete(`/syllabus/topics/${id}`).then((r) => r.data),

  reorderTopics: (subjectId: string, orderedIds: string[]) =>
    api.put(`/syllabus/subjects/${subjectId}/topics/reorder`, { orderedIds }).then((r) => r.data),

  getGroupProgress: (groupId: string): Promise<TopicWithProgress[]> =>
    api.get(`/syllabus/groups/${groupId}/progress`).then((r) => r.data),

  markProgress: (groupId: string, data: {
    topicId: string;
    weekNumber: number;
    coveredAt?: string;
    notes?: string | null;
  }) =>
    api.post(`/syllabus/groups/${groupId}/progress`, data).then((r) => r.data),

  removeProgress: (groupId: string, topicId: string) =>
    api.delete(`/syllabus/groups/${groupId}/progress/${topicId}`).then((r) => r.data),
};
