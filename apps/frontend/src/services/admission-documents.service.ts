import { api } from "./api";
import axios from "axios";

export interface RequiredDocType {
  type: string;
  label: string;
}

export interface AdmissionDocument {
  id: string;
  studentId: string;
  type: string;
  fileKey: string;
  fileName: string;
  fileSize: number;
  fileMimeType: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  uploadedAt: string;
}

const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const admissionDocumentsService = {
  getRequiredTypes: (): Promise<RequiredDocType[]> =>
    api.get("/admission-documents/required-types").then((r) => r.data),

  create: (
    data: {
      type: string;
      fileKey: string;
      fileName: string;
      fileSize: number;
      fileMimeType: string;
    },
    uploadToken?: string,
  ): Promise<AdmissionDocument> => {
    if (uploadToken) {
      return axios
        .post(`${baseUrl}/admission-documents`, data, {
          headers: { Authorization: `Bearer ${uploadToken}` },
        })
        .then((r) => r.data);
    }
    return api.post("/admission-documents", data).then((r) => r.data);
  },

  listMine: (): Promise<AdmissionDocument[]> =>
    api.get("/admission-documents/me").then((r) => r.data),

  listByStudent: (studentId: string): Promise<AdmissionDocument[]> =>
    api.get(`/admission-documents/student/${studentId}`).then((r) => r.data),

  approve: (id: string): Promise<AdmissionDocument> =>
    api.post(`/admission-documents/${id}/approve`).then((r) => r.data),

  reject: (id: string, reason: string): Promise<AdmissionDocument> =>
    api.post(`/admission-documents/${id}/reject`, { reason }).then((r) => r.data),

  uploadFile: (
    file: File,
    uploadToken?: string,
  ): Promise<{
    key: string;
    url: string;
    originalName: string;
    mimeType: string;
    size: number;
  }> => {
    const formData = new FormData();
    formData.append("file", file);
    if (uploadToken) {
      return axios
        .post(`${baseUrl}/uploads`, formData, {
          headers: {
            Authorization: `Bearer ${uploadToken}`,
            "Content-Type": "multipart/form-data",
          },
        })
        .then((r) => r.data);
    }
    return api
      .post("/uploads", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
};
