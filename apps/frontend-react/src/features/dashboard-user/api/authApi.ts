import { type ApiResponse, axiosClient } from '../../../api/axiosClient';
import type { LoginTenantPayload } from '../../tenant/api/authApi';

export interface DashboardUserInfo {
  user_id: string;
  tenant_id: string;
  agent_id?: string;
  agent_ids?: string[];
  email: string;
  name: string;
  system_role: 'manager';
  created_at: string;
}

export interface InvitationInfo {
  email: string;
  name: string;
  business_name: string;
  agent_id: string;
  system_role: string;
}

export interface AcceptInvitationPayload {
  token: string;
  password: string;
}

export const dashboardUserAuthApi = {
  login: async (payload: LoginTenantPayload): Promise<ApiResponse<DashboardUserInfo>> => {
    const { data } = await axiosClient.post<ApiResponse<DashboardUserInfo>>(
      '/api/v1/dashboard-user/auth/login',
      payload,
    );
    return data;
  },

  getProfile: async (): Promise<ApiResponse<DashboardUserInfo>> => {
    const { data } = await axiosClient.get<ApiResponse<DashboardUserInfo>>(
      '/api/v1/dashboard-user/auth/me',
    );
    return data;
  },

  getInvitationInfo: async (token: string): Promise<ApiResponse<InvitationInfo>> => {
    const { data } = await axiosClient.get<ApiResponse<InvitationInfo>>(
      '/api/v1/dashboard-user/auth/invitation-info',
      { params: { token } },
    );
    return data;
  },

  acceptInvitation: async (
    payload: AcceptInvitationPayload,
  ): Promise<ApiResponse<DashboardUserInfo>> => {
    const { data } = await axiosClient.post<ApiResponse<DashboardUserInfo>>(
      '/api/v1/dashboard-user/auth/accept-invite',
      payload,
    );
    return data;
  },

  forgotPassword: async (email: string): Promise<ApiResponse<null>> => {
    const { data } = await axiosClient.post<ApiResponse<null>>(
      '/api/v1/dashboard-user/auth/forgot-password',
      { email },
    );
    return data;
  },

  resetPassword: async (payload: {
    token: string;
    new_password: string;
  }): Promise<ApiResponse<null>> => {
    const { data } = await axiosClient.post<ApiResponse<null>>(
      '/api/v1/dashboard-user/auth/reset-password',
      payload,
    );
    return data;
  },

  logout: async (): Promise<ApiResponse<null>> => {
    const { data } = await axiosClient.post<ApiResponse<null>>(
      '/api/v1/dashboard-user/auth/logout',
    );
    return data;
  },
};
