import axios, { AxiosError } from 'axios';

export interface RegisterTenantPayload {
  business_name: string;
  full_name: string;
  email: string;
  password: string;
}

export interface RegisterTenantResponse {
  tenant_id: string;
  message: string;
  verification_token?: string;
}

export interface LoginTenantPayload {
  email: string;
  password: string;
}

export interface TenantInfo {
  tenant_id: string;
  business_name: string;
  contact_email: string;
  tier: string;
  status: string;
}

export interface LoginTenantResponse {
  message: string;
  tenant: TenantInfo;
}

export interface VerifyEmailResponse {
  message: string;
  tenant_id: string;
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1/tenant/auth',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});


apiClient.interceptors.response.use(
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

export const authApi = {
  register: async (payload: RegisterTenantPayload): Promise<RegisterTenantResponse> => {
    const { data } = await apiClient.post<RegisterTenantResponse>('/register', payload);
    return data;
  },

  login: async (payload: LoginTenantPayload): Promise<LoginTenantResponse> => {
    const { data } = await apiClient.post<LoginTenantResponse>('/login', payload);
    return data;
  },

  verifyEmail: async (token: string): Promise<VerifyEmailResponse> => {
    const { data } = await apiClient.get<VerifyEmailResponse>(`/verify-email?token=${encodeURIComponent(token)}`);
    return data;
  },

  logout: async (): Promise<{ message: string }> => {
    const { data } = await apiClient.post<{ message: string }>('/logout');
    return data;
  },
};
