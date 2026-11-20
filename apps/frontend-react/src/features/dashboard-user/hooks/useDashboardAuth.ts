import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse } from '../../../api/axiosClient';
import type { LoginTenantPayload } from '../../tenant/api/authApi';
import {
  dashboardUserAuthApi,
  type AcceptInvitationPayload,
  type DashboardUserInfo,
  type InvitationInfo,
} from '../api/authApi';
import { useDashboardAuthStore } from '../../../store/useDashboardAuthStore';

export const DASHBOARD_AUTH_KEYS = {
  all: ['dashboard-user'] as const,
  profile: () => [...DASHBOARD_AUTH_KEYS.all, 'profile'] as const,
  invitation: (token: string) => [...DASHBOARD_AUTH_KEYS.all, 'invitation', token] as const,
};

export function useDashboardLogin() {
  const queryClient = useQueryClient();
  const setDashboardUser = useDashboardAuthStore((state) => state.login);

  return useMutation<ApiResponse<DashboardUserInfo>, Error, LoginTenantPayload>({
    mutationFn: (payload) => dashboardUserAuthApi.login(payload),
    onSuccess: (res) => {
      if (res?.data) {
        setDashboardUser(res.data);
      }
      queryClient.invalidateQueries({ queryKey: DASHBOARD_AUTH_KEYS.profile() });
    },
  });
}

export function useDashboardProfile(enabled: boolean = true) {
  const setDashboardUser = useDashboardAuthStore((state) => state.login);

  return useQuery<ApiResponse<DashboardUserInfo>, Error>({
    queryKey: DASHBOARD_AUTH_KEYS.profile(),
    queryFn: async () => {
      const res = await dashboardUserAuthApi.getProfile();
      if (res?.data) {
        setDashboardUser(res.data);
      }
      return res;
    },
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<DashboardUserInfo>, Error, AcceptInvitationPayload>({
    mutationFn: (payload) => dashboardUserAuthApi.acceptInvitation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_AUTH_KEYS.profile() });
    },
  });
}

export function useInvitationInfo(token: string, enabled: boolean = true) {
  return useQuery<ApiResponse<InvitationInfo>, Error>({
    queryKey: DASHBOARD_AUTH_KEYS.invitation(token),
    queryFn: () => dashboardUserAuthApi.getInvitationInfo(token),
    enabled: enabled && Boolean(token),
    retry: false,
  });
}

export function useDashboardLogout() {
  const queryClient = useQueryClient();
  const logoutDashboard = useDashboardAuthStore((state) => state.logout);

  return useMutation<ApiResponse<null>, Error, void>({
    mutationFn: () => dashboardUserAuthApi.logout(),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: DASHBOARD_AUTH_KEYS.all });
      logoutDashboard();
    },
  });
}
