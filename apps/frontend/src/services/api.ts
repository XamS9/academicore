import axios from "axios";

/**
 * Reads the user-facing message from an Axios error body.
 * `HttpError` from the API is serialized as `{ error: string }`; some paths may use `message`.
 */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  const ax = err as { response?: { data?: unknown } };
  const data = ax.response?.data;
  if (data && typeof data === "object" && data !== null) {
    const o = data as Record<string, unknown>;
    if (typeof o.error === "string" && o.error.trim()) return o.error;
    if (typeof o.message === "string" && o.message.trim()) return o.message;
  }
  return fallback;
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  headers: { "Content-Type": "application/json" },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — clear token and redirect to login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const isLoginRequest = error.config?.url?.includes("/auth/login");
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("academicore_token");
      localStorage.removeItem("academicore_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
