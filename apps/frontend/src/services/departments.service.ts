import { api } from "./api";

export interface Department {
  id: string;
  name: string;
}

export const departmentsService = {
  getAll: (): Promise<Department[]> =>
    api.get("/departments").then((r) => r.data),
};
