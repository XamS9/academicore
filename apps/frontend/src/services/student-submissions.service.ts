import { api } from "./api";

export interface StudentSubmission {
  id: string;
  studentId: string;
  evaluationId: string;
  title: string;
  type: "LINK" | "TEXT" | "FILE_REF";
  content: string;
  fileKey: string | null;
  fileName: string | null;
  fileSize: number | null;
  fileMimeType: string | null;
  submittedAt: string;
  updatedAt: string;
}

export interface UploadedFileInfo {
  key: string;
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
}

// Returned by GET /student-submissions/evaluation/:id (teacher/admin view)
export interface StudentSubmissionWithStudent extends StudentSubmission {
  student: {
    id: string;
    studentCode: string;
    user: { firstName: string; lastName: string };
  };
}

// StudentSubmissionWithEval inherits all fields from StudentSubmission (including file fields)
export interface StudentSubmissionWithEval extends StudentSubmission {
  evaluation: {
    id: string;
    name: string;
    groupId: string;
    dueDate: string | null;
    weight: number;
    evaluationType: { name: string };
  };
}

export const studentSubmissionsService = {
  getByStudent: (studentId: string): Promise<StudentSubmissionWithEval[]> =>
    api.get(`/student-submissions/student/${studentId}`).then((r) => r.data),

  getByEvaluation: (evaluationId: string): Promise<StudentSubmissionWithStudent[]> =>
    api
      .get(`/student-submissions/evaluation/${evaluationId}`)
      .then((r) => r.data),

  create: (data: {
    studentId: string;
    evaluationId: string;
    title: string;
    type: "LINK" | "TEXT" | "FILE_REF";
    content: string;
    fileKey?: string;
    fileName?: string;
    fileSize?: number;
    fileMimeType?: string;
  }): Promise<StudentSubmission> =>
    api.post("/student-submissions", data).then((r) => r.data),

  update: (
    id: string,
    data: {
      title?: string;
      type?: string;
      content?: string;
      fileKey?: string | null;
      fileName?: string | null;
      fileSize?: number | null;
      fileMimeType?: string | null;
    },
  ): Promise<StudentSubmission> =>
    api.patch(`/student-submissions/${id}`, data).then((r) => r.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/student-submissions/${id}`).then((r) => r.data),

  uploadFile: (file: File): Promise<UploadedFileInfo> => {
    const form = new FormData();
    form.append("file", file);
    return api
      .post("/uploads", form, { headers: { "Content-Type": "multipart/form-data" } })
      .then((r) => r.data);
  },
};
