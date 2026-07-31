import axios, { type InternalAxiosRequestConfig } from "axios";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

const requestStartedAt = new WeakMap<InternalAxiosRequestConfig, number>();
const apiDebugEnabled = process.env.NEXT_PUBLIC_API_DEBUG === "1";

api.interceptors.request.use(
  (config) => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("customer_token")
        : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (apiDebugEnabled) {
      requestStartedAt.set(config, performance.now());
      console.debug("[API:start]", config.method?.toUpperCase(), config.url);
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => {
    if (apiDebugEnabled) {
      const startedAt = requestStartedAt.get(response.config);
      const duration = startedAt ? Math.round(performance.now() - startedAt) : null;

      console.debug(
        "[API:end]",
        response.config.method?.toUpperCase(),
        response.config.url,
        response.status,
        duration === null ? "-" : `${duration}ms`,
      );
    }

    return response;
  },
  (error) => {
    if (apiDebugEnabled && error.config) {
      const startedAt = requestStartedAt.get(error.config);
      const duration = startedAt ? Math.round(performance.now() - startedAt) : null;

      console.error(
        "[API:error]",
        error.config.method?.toUpperCase(),
        error.config.url,
        error.response?.status || error.code,
        duration === null ? "-" : `${duration}ms`,
      );
    }

    return Promise.reject(error);
  },
);

export default api;
