import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getSession, signOut } from "next-auth/react";

// Backend base URL — network adresine göre
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://192.168.1.108:5000";

export const axiosInstance = axios.create({
  baseURL: BACKEND_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Refresh Token Queue (Mutex) ──────────────────────────────────────────────
// Aynı anda birden fazla istek 401 alırsa, hepsi tek refresh bekler

let isRefreshing = false;

type QueueItem = {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};

let failedQueue: QueueItem[] = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((item) => {
    if (error) {
      item.reject(error);
    } else {
      item.resolve(token!);
    }
  });
  failedQueue = [];
}

let cachedSession: any = null;
let lastSessionFetch = 0;
const SESSION_CACHE_TTL = 60 * 1000; // 1 dakika

async function getCachedSession() {
  const now = Date.now();
  if (cachedSession !== null && now - lastSessionFetch < SESSION_CACHE_TTL) {
    return cachedSession;
  }
  try {
    cachedSession = await getSession();
    lastSessionFetch = now;
  } catch {
    cachedSession = null;
  }
  return cachedSession;
}

// ─── Request Interceptor ──────────────────────────────────────────────────────

axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const session = await getCachedSession();
    const token = (session as any)?.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// PascalCase -> camelCase Dönüştürücü (Backend'den gelen verileri frontend'e uygun hale getirmek için)
function toCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map((v) => toCamelCase(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
      result[camelKey] = toCamelCase(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
}

// ─── Response Interceptor ─────────────────────────────────────────────────────

axiosInstance.interceptors.response.use(
  (response) => {
    // Tüm backend yanıtlarındaki PascalCase anahtarları otomatik camelCase'e çevir
    if (response.data) {
      response.data = toCamelCase(response.data);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Sadece 401, refresh endpoint'i değil, ilk deneme
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("auth/refresh-token")
    ) {
      if (isRefreshing) {
        // Başka bir refresh zaten devam ediyor → kuyruğa al
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const session = await getSession();
        const refreshToken = (session as any)?.refreshToken;

        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await axios.post(
          `${BACKEND_URL}/api/v1/auth/refresh-token`,
          { refreshToken }
        );

        const newAccessToken: string = data?.data?.token;
        if (!newAccessToken) throw new Error("Invalid refresh response");

        // Kuyruktaki tüm bekleyen istekleri yeni token ile çöz
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Session temizle ve login'e yönlendir
        await signOut({ redirect: false });
        if (typeof window !== "undefined") {
          window.location.href = "/login?sessionExpired=true";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
