import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../features/tenant/api/authApi";
import type {
  RegisterTenantPayload,
  RegisterTenantData,
  LoginTenantPayload,
  TenantInfo,
  DashboardUserInfo,
} from "../features/tenant/api/authApi";
import type { ApiResponse } from "../api/axiosClient";

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

  return useMutation<ApiResponse<TenantInfo>, Error, LoginTenantPayload>({
    mutationFn: (payload: LoginTenantPayload) => authApi.login(payload),
    onSuccess: (res) => {
      queryClient.setQueryData(["currentTenant"], res.data);
    },
  });
}

export function useGoogleLoginTenant() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<TenantInfo>, Error, { id_token: string }>({
    mutationFn: (payload: { id_token: string }) => authApi.googleLogin(payload),
    onSuccess: (res) => {
      queryClient.setQueryData(["currentTenant"], res.data);
    },
  });
}

export function useDashboardLogin() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<DashboardUserInfo>, Error, LoginTenantPayload>(
    {
      mutationFn: (payload: LoginTenantPayload) =>
        authApi.dashboardLogin(payload),
      onSuccess: (res) => {
        queryClient.setQueryData(["currentDashboardUser"], res.data);
      },
    },
  );
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

  return useMutation<ApiResponse<null>, Error, void>({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
