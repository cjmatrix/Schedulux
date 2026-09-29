import axios, { AxiosError } from 'axios';

export interface LoginSuperAdminPayload {
  email: string;
  password: string;
}

export interface SuperAdminInfo {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

export interface LoginSuperAdminResponse {
  message: string;
  superAdmin: SuperAdminInfo;
}

export interface SuperAdminProfileResponse {
  superAdmin: SuperAdminInfo;
}

const superAdminClient = axios.create({
  baseURL: 'http://localhost:5000/api/v1/superadmin/auth',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

superAdminClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string; message?: string }>) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export const superAdminApi = {
  login: async (payload: LoginSuperAdminPayload): Promise<LoginSuperAdminResponse> => {
    const { data } = await superAdminClient.post<LoginSuperAdminResponse>('/login', payload);
    return data;
  },

  logout: async (): Promise<{ message: string }> => {
    const { data } = await superAdminClient.post<{ message: string }>('/logout');
    return data;
  },

  getProfile: async (): Promise<SuperAdminProfileResponse> => {
    const { data } = await superAdminClient.get<SuperAdminProfileResponse>('/me');
    return data;
  },

  refreshToken: async (): Promise<void> => {
    await superAdminClient.post('/refresh-token');
  },
};
