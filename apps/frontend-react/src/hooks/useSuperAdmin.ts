import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { superAdminApi } from '../api/superAdminApi';
import type {
  LoginSuperAdminPayload,
  LoginSuperAdminResponse,
  SuperAdminProfileResponse,
} from '../api/superAdminApi';

export function useSuperAdminLogin() {
  const queryClient = useQueryClient();

  return useMutation<LoginSuperAdminResponse, Error, LoginSuperAdminPayload>({
    mutationFn: (payload) => superAdminApi.login(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(['superAdmin'], data.superAdmin);
    },
  });
}

export function useSuperAdminLogout() {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, void>({
    mutationFn: () => superAdminApi.logout(),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['superAdmin'] });
    },
  });
}

export function useSuperAdminProfile() {
  return useQuery<SuperAdminProfileResponse, Error>({
    queryKey: ['superAdmin'],
    queryFn: () => superAdminApi.getProfile(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
