import { api } from "./api";

export const systemSettingsService = {
  get: () => api.get("/configuracion").then((r) => r.data),
  update: (data: object) =>
    api.patch("/configuracion", data).then((r) => r.data),
};
