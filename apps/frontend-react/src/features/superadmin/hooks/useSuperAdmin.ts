import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse } from '../../../api/axiosClient';
import { superAdminApi } from '../api/superAdminApi';
import type { LoginSuperAdminPayload, SuperAdminInfo } from '../api/superAdminAuthApi';
import { superAdminAuthApi } from '../api/superAdminAuthApi';
import { useSuperAdminStore } from '../store/useSuperAdminStore';

export function useSuperAdminLogin() {
  const queryClient = useQueryClient();
  const setSuperAdmin = useSuperAdminStore((state) => state.setSuperAdmin);

  return useMutation<ApiResponse<SuperAdminInfo>, Error, LoginSuperAdminPayload>({
    mutationFn: (payload) => superAdminAuthApi.login(payload),
    onSuccess: (res) => {
      queryClient.setQueryData(['superAdmin'], res);
      if (res?.data) {
        setSuperAdmin(res.data);
      }
    },
  });
}

export function useSuperAdminLogout() {
  const queryClient = useQueryClient();
  const superAdminLogout = useSuperAdminStore((state) => state.logout);

  return useMutation<ApiResponse<null>, Error, void>({
    mutationFn: () => superAdminAuthApi.logout(),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['superAdmin'] });
      superAdminLogout();
    },
  });
}

export function useSuperAdminProfile() {
  const setSuperAdmin = useSuperAdminStore((state) => state.setSuperAdmin);

  return useQuery<ApiResponse<SuperAdminInfo>, Error>({
    queryKey: ['superAdmin'],
    queryFn: async () => {
      const res = await superAdminAuthApi.getProfile();
      if (res?.data) {
        setSuperAdmin(res.data);
      }
      return res;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSuperAdminTenants(
  page = 1,
  limit = 10,
  search?: string,
  tier?: string,
  status?: string,
) {
  return useQuery({
    queryKey: ['superAdminTenants', page, limit, search, tier, status],
    queryFn: () => superAdminApi.getTenants(page, limit, search, tier, status),
    staleTime: 30 * 1000,
  });
}

export function useSuspendTenant() {
  const queryClient = useQueryClient();

  return useMutation<{ message: string; data: Record<string, unknown> }, Error, string>({
    mutationFn: (tenantId: string) => superAdminApi.suspendTenant(tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superAdminTenants'] });
    },
  });
}
