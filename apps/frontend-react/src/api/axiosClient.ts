import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipGlobalToast?: boolean;
  }
}

export interface ApiResponse<T> {
  message: string;
  data: T;
}

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/dashboarduser')) {
    config.headers['x-auth-type'] = 'dashboard_user';
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const AUTH_BYPASS_REFRESH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/google',
  '/auth/refresh-token',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/accept-invite',
];

function extractApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ error?: string | string[]; message?: string | string[] }>(error)) {
    const resData = error.response?.data;
    const rawMsg = resData?.message || resData?.error;
    return (
      (Array.isArray(rawMsg) ? rawMsg.join(', ') : rawMsg) ||
      error.message ||
      'An unexpected error occurred'
    );
  }
  return error instanceof Error ? error.message : 'An unexpected error occurred';
}

axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ error?: string | string[]; message?: string | string[] }>) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    const reqUrl = originalRequest?.url || '';
    const shouldSkipRefresh = AUTH_BYPASS_REFRESH_PATHS.some((path) => reqUrl.includes(path));

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !shouldSkipRefresh
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return axiosClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        if (originalRequest.url?.includes('/superadmin/')) {
          await axios.post(
            `${axiosClient.defaults.baseURL}/api/v1/superadmin/auth/refresh-token`,
            {},
            { withCredentials: true },
          );
        } else if (
          originalRequest.url?.includes('/dashboard-user/') ||
          originalRequest.headers?.['x-auth-type'] === 'dashboard_user' ||
          (typeof window !== 'undefined' && window.location.pathname.startsWith('/dashboarduser'))
        ) {
          await axios.post(
            `${axiosClient.defaults.baseURL}/api/v1/dashboard-user/auth/refresh-token`,
            {},
            { withCredentials: true },
          );
        } else {
          await axios.post(
            `${axiosClient.defaults.baseURL}/api/v1/tenant/auth/refresh-token`,
            {},
            { withCredentials: true },
          );
        }

        processQueue(null);
        return axiosClient(originalRequest);
      } catch (refreshError: unknown) {
        const refreshMessage = extractApiErrorMessage(refreshError);
        const normalizedRefreshErr = new Error(refreshMessage);
        processQueue(normalizedRefreshErr);

        window.dispatchEvent(new Event('auth:unauthorized'));
        return Promise.reject(normalizedRefreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    const message = extractApiErrorMessage(error);

    const customConfig = originalRequest as { skipGlobalToast?: boolean } | undefined;
    if (!customConfig?.skipGlobalToast && error.response?.status !== 401) {
      toast.error(message, {
        id: message,
        duration: 5000,
      });
    }

    return Promise.reject(new Error(message));
  },
);
