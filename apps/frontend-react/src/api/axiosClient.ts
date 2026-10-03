import axios, { AxiosError } from 'axios';

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

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void, reject: (reason?: any) => void }> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ error?: string; message?: string }>) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
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
            { withCredentials: true }
          );
        } else if (originalRequest.url?.includes('/dashboard-user/')) {
          await axios.post(
            `${axiosClient.defaults.baseURL}/api/v1/dashboard-user/auth/refresh-token`,
            {},
            { withCredentials: true }
          );
        } else {
          await axios.post(
            `${axiosClient.defaults.baseURL}/api/v1/tenant/auth/refresh-token`,
            {},
            { withCredentials: true }
          );
        }

        processQueue(null);
        return axiosClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error);
       
        window.dispatchEvent(new Event('auth:unauthorized'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);
