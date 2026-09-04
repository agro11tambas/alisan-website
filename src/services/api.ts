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

// Pembacaan katalog terjadi saat render server, jadi sekali melempar seluruh
// halaman jatuh ke error boundary. Kegagalan yang jelas sementara — timeout,
// koneksi putus, 5xx (termasuk 503 saat cache ERP dingin), 429 — dicoba ulang
// dulu dengan jeda menaik. Yang tetap tidak boleh: menelan kegagalan lalu
// mengembalikan daftar kosong, karena hasil kosong itu ikut disimpan ISR dan
// pengunjung melihat toko kosong selama beberapa menit.
const RETRIES = 3;

// Default 10 detik di atas terlalu ketat untuk ERP di shared hosting saat
// sibuk; batas ini hanya berlaku untuk pembacaan katalog di server.
const READ_TIMEOUT_MS = 20000;

const isRetriable = (error: unknown): boolean => {
  if (!axios.isAxiosError(error)) return false;

  // Tanpa respons sama sekali: timeout, DNS, koneksi ditolak atau putus.
  if (!error.response) return true;

  const status = error.response.status;
  return status === 429 || status >= 500;
};

// `Retry-After` dipakai kalau backend mengirimkannya, selain itu jeda menaik
// 1s, 2s, 4s dengan batas 5 detik supaya render tidak menggantung terlalu lama.
const retryDelayMs = (error: unknown, attempt: number): number => {
  const header = axios.isAxiosError(error)
    ? Number(error.response?.headers?.["retry-after"])
    : NaN;

  const seconds = Number.isFinite(header) && header > 0 ? header : 2 ** attempt;

  return Math.min(Math.max(seconds, 1), 5) * 1000;
};

/** GET yang mengulang sendiri saat ERP sedang goyah, lalu melempar kalau tetap gagal. */
export const getWithRetry = async (url: string) => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      return await api.get(url, { timeout: READ_TIMEOUT_MS });
    } catch (error) {
      lastError = error;

      if (attempt === RETRIES || !isRetriable(error)) {
        throw error;
      }

      const reason = axios.isAxiosError(error)
        ? error.response?.status ?? error.code
        : "unknown";
      const waitMs = retryDelayMs(error, attempt);

      console.warn(
        `[api] ${url} gagal (${reason}), coba lagi dalam ${waitMs}ms (${attempt + 1}/${RETRIES})`,
      );

      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }

  throw lastError;
};

export default api;
