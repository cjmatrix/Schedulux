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

export type { DashboardUserInfo } from "../../dashboard-user/api/authApi";


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

  forgotPassword: async (email: string): Promise<ApiResponse<null>> => {
    const { data } = await axiosClient.post<ApiResponse<null>>(
      "/api/v1/tenant/auth/forgot-password",
      { email },
    );
    return data;
  },

  resetPassword: async (payload: { token: string; new_password: string }): Promise<ApiResponse<null>> => {
    const { data } = await axiosClient.post<ApiResponse<null>>(
      "/api/v1/tenant/auth/reset-password",
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

  getProfile: async (): Promise<ApiResponse<TenantInfo>> => {
    const { data } = await axiosClient.get<ApiResponse<TenantInfo>>(
      "/api/v1/tenant/auth/me",
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
