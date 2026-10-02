import { axiosClient, type ApiResponse } from "../../../api/axiosClient";

export interface RegisterTenantPayload {
  business_name: string;
  full_name: string;
  email: string;
  password: string;
}

export interface RegisterTenantData {
  tenant_id: string;
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

export interface DashboardUserInfo {
  user_id: string;
  tenant_id: string;
  email: string;
  name: string;
  system_role: "root" | "manager";
  created_at: string;
}

export const authApi = {
  register: async (
    payload: RegisterTenantPayload,
  ): Promise<ApiResponse<RegisterTenantData>> => {
    const { data } = await axiosClient.post<ApiResponse<RegisterTenantData>>(
      "/api/v1/tenant/auth/register",
      payload,
    );
    return data;
  },

  login: async (
    payload: LoginTenantPayload,
  ): Promise<ApiResponse<TenantInfo>> => {
    const { data } = await axiosClient.post<ApiResponse<TenantInfo>>(
      "/api/v1/tenant/auth/login",
      payload,
    );
    return data;
  },

  googleLogin: async (
    payload: { id_token: string },
  ): Promise<ApiResponse<TenantInfo>> => {
    const { data } = await axiosClient.post<ApiResponse<TenantInfo>>(
      "/api/v1/tenant/auth/google",
      payload,
    );
    return data;
  },

  dashboardLogin: async (
    payload: LoginTenantPayload,
  ): Promise<ApiResponse<DashboardUserInfo>> => {
    const { data } = await axiosClient.post<ApiResponse<DashboardUserInfo>>(
      "/api/v1/dashboard-user/auth/login",
      payload,
    );
    return data;
  },

  verifyEmail: async (
    token: string,
  ): Promise<ApiResponse<{ tenant_id: string }>> => {
    const { data } = await axiosClient.get<ApiResponse<{ tenant_id: string }>>(
      `/api/v1/tenant/auth/verify-email?token=${encodeURIComponent(token)}`,
    );
    return data;
  },

  logout: async (): Promise<ApiResponse<null>> => {
    const { data } = await axiosClient.post<ApiResponse<null>>(
      "/api/v1/tenant/auth/logout",
    );
    return data;
  },
};
