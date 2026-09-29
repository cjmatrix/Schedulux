import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import type {
  RegisterTenantPayload,
  RegisterTenantResponse,
  LoginTenantPayload,
  LoginTenantResponse,
  VerifyEmailResponse,
} from '../api/authApi';

export function useRegister() {
  return useMutation<RegisterTenantResponse, Error, RegisterTenantPayload>({
    mutationFn: (payload: RegisterTenantPayload) => authApi.register(payload),
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation<LoginTenantResponse, Error, LoginTenantPayload>({
    mutationFn: (payload: LoginTenantPayload) => authApi.login(payload),
    onSuccess: (data) => {
     
      queryClient.setQueryData(['currentTenant'], data.tenant);
    },
  });
}

export function useVerifyEmail() {
  const queryClient = useQueryClient();

  return useMutation<VerifyEmailResponse, Error, string>({
    mutationFn: (token: string) => authApi.verifyEmail(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentTenant'] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, void>({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
