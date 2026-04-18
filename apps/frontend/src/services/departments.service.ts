import { api } from "./api";

export interface Department {
  id: string;
  name: string;
}

export const departmentsService = {
  getAll: (): Promise<Department[]> =>
    api.get("/departments").then((r) => r.data),
  create: (data: { name: string }): Promise<Department> =>
    api.post("/departments", data).then((r) => r.data),
  update: (id: string, data: { name: string }): Promise<Department> =>
    api.patch(`/departments/${id}`, data).then((r) => r.data),
  remove: (id: string): Promise<void> =>
    api.delete(`/departments/${id}`).then(() => undefined),
};
