import { axiosClient, type ApiResponse } from "../../../api/axiosClient";
import type { LoginTenantPayload } from "../../tenant/api/authApi";

export interface DashboardUserInfo {
  user_id: string;
  tenant_id: string;
  email: string;
  name: string;
  system_role: "root" | "manager";
  created_at: string;
}

export const dashboardUserAuthApi = {
  login: async (
    payload: LoginTenantPayload,
  ): Promise<ApiResponse<DashboardUserInfo>> => {
    const { data } = await axiosClient.post<ApiResponse<DashboardUserInfo>>(
      "/api/v1/dashboard-user/auth/login",
      payload,
    );
    return data;
  },

  getProfile: async (): Promise<ApiResponse<DashboardUserInfo>> => {
    const { data } = await axiosClient.get<ApiResponse<DashboardUserInfo>>(
      "/api/v1/dashboard-user/auth/me",
    );
    return data;
  },
};
