import { axiosClient, type ApiResponse } from '../../../api/axiosClient';

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

export const superAdminAuthApi = {
  login: async (payload: LoginSuperAdminPayload): Promise<ApiResponse<SuperAdminInfo>> => {
    const { data } = await axiosClient.post<ApiResponse<SuperAdminInfo>>('/api/v1/superadmin/auth/login', payload);
    return data;
  },

  logout: async (): Promise<ApiResponse<null>> => {
    const { data } = await axiosClient.post<ApiResponse<null>>('/api/v1/superadmin/auth/logout');
    return data;
  },

  getProfile: async (): Promise<ApiResponse<SuperAdminInfo>> => {
    const { data } = await axiosClient.get<ApiResponse<SuperAdminInfo>>('/api/v1/superadmin/auth/me');
    return data;
  },

  refreshToken: async (): Promise<void> => {
    await axiosClient.post('/api/v1/superadmin/auth/refresh-token');
  },
};
