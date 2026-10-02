import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { superAdminAuthApi } from '../api/superAdminAuthApi';
import { superAdminApi } from '../api/superAdminApi';
import type {
  LoginSuperAdminPayload,
  SuperAdminInfo,
} from '../api/superAdminAuthApi';
import type { ApiResponse } from '../../../api/axiosClient';

export function useSuperAdminLogin() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<SuperAdminInfo>, Error, LoginSuperAdminPayload>({
    mutationFn: (payload) => superAdminAuthApi.login(payload),
    onSuccess: (res) => {
      queryClient.setQueryData(['superAdmin'], res.data);
    },
  });
}

export function useSuperAdminLogout() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<null>, Error, void>({
    mutationFn: () => superAdminAuthApi.logout(),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['superAdmin'] });
    },
  });
}

export function useSuperAdminProfile() {
  return useQuery<ApiResponse<SuperAdminInfo>, Error>({
    queryKey: ['superAdmin'],
    queryFn: () => superAdminAuthApi.getProfile(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSuperAdminTenants(page = 1, limit = 10, search?: string, tier?: string, status?: string) {
  return useQuery({
    queryKey: ['superAdminTenants', page, limit, search, tier, status],
    queryFn: () => superAdminApi.getTenants(page, limit, search, tier, status),
    staleTime: 30 * 1000,
  });
}

export function useSuspendTenant() {
  const queryClient = useQueryClient();

  return useMutation<{ message: string; data: any }, Error, string>({
    mutationFn: (tenantId: string) => superAdminApi.suspendTenant(tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superAdminTenants'] });
    },
  });
}
