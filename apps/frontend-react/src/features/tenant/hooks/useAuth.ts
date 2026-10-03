import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../api/authApi";
import { useAuthStore } from "../../../store/useAuthStore";
import {
  dashboardUserAuthApi,
  type DashboardUserInfo,
} from "../../dashboard-user/api/authApi";
import type {
  RegisterTenantPayload,
  RegisterTenantData,
  LoginTenantPayload,
  TenantInfo,
} from "../api/authApi";
import type { ApiResponse } from "../../../api/axiosClient";

export function useRegister() {
  return useMutation<
    ApiResponse<RegisterTenantData>,
    Error,
    RegisterTenantPayload
  >({
    mutationFn: (payload: RegisterTenantPayload) => authApi.register(payload),
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const authLogin = useAuthStore((state) => state.login);

  return useMutation<ApiResponse<TenantInfo>, Error, LoginTenantPayload>({
    mutationFn: (payload: LoginTenantPayload) => authApi.login(payload),
    onSuccess: (res) => {
      queryClient.setQueryData(["currentTenant"], res);
      if (res?.data) {
        authLogin(res.data);
      }
    },
  });
}

export function useGoogleLoginTenant() {
  const queryClient = useQueryClient();
  const authLogin = useAuthStore((state) => state.login);

  return useMutation<ApiResponse<TenantInfo>, Error, { id_token: string }>({
    mutationFn: (payload: { id_token: string }) => authApi.googleLogin(payload),
    onSuccess: (res) => {
      queryClient.setQueryData(["currentTenant"], res);
      if (res?.data) {
        authLogin(res.data);
      }
    },
  });
}

export function useTenantProfile(enabled: boolean = true) {
  const authLogin = useAuthStore((state) => state.login);

  return useQuery<ApiResponse<TenantInfo>, Error>({
    queryKey: ["currentTenant"],
    queryFn: async () => {
      const res = await authApi.getProfile();
      if (res?.data) {
        authLogin(res.data);
      }
      return res;
    },
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDashboardLogin() {
  const queryClient = useQueryClient();
  const authLogin = useAuthStore((state) => state.login);

  return useMutation<ApiResponse<DashboardUserInfo>, Error, LoginTenantPayload>(
    {
      mutationFn: (payload: LoginTenantPayload) =>
        dashboardUserAuthApi.login(payload),
      onSuccess: (res) => {
        queryClient.setQueryData(["currentDashboardUser"], res.data);
        if (res?.data) {
          authLogin(res.data);
        }
      },
    },
  );
}

export function useDashboardProfile(enabled: boolean = true) {
  const authLogin = useAuthStore((state) => state.login);

  return useQuery<ApiResponse<DashboardUserInfo>, Error>({
    queryKey: ["currentDashboardUser"],
    queryFn: async () => {
      const res = await dashboardUserAuthApi.getProfile();
      if (res?.data) {
        authLogin(res.data);
      }
      return res;
    },
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useVerifyEmail() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<{ tenant_id: string }>, Error, string>({
    mutationFn: (token: string) => authApi.verifyEmail(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentTenant"] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const authLogout = useAuthStore((state) => state.logout);

  return useMutation<ApiResponse<null>, Error, void>({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      queryClient.clear();
      authLogout();
    },
  });
}
