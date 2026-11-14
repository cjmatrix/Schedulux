import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse } from '../../../api/axiosClient';
import type {
  InviteUserRequest,
  InviteUserResponse,
  ListWorkspaceUsersResponse,
  WorkspaceUserInfo,
} from '../api/tenantApi';
import { tenantApi } from '../api/tenantApi';

export const WORKSPACE_USERS_KEYS = {
  all: ['workspaceUsers'] as const,
  list: (
    tenantId: string,
    page?: number,
    limit?: number,
    search?: string,
    role?: string,
    agentId?: string,
  ) => ['workspaceUsers', tenantId, agentId, page, limit, search, role] as const,
};

export function useWorkspaceUsers(
  tenantId: string,
  page?: number,
  limit?: number,
  search?: string,
  role?: string,
  agentId?: string,
) {
  return useQuery<ApiResponse<ListWorkspaceUsersResponse>, Error>({
    queryKey: WORKSPACE_USERS_KEYS.list(tenantId, page, limit, search, role, agentId),
    queryFn: () => tenantApi.getWorkspaceUsers(tenantId, page, limit, search, role, agentId),
    enabled: Boolean(tenantId),
    staleTime: 30 * 1000,
  });
}

export function useInviteUser() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<InviteUserResponse>, Error, InviteUserRequest>({
    mutationFn: (payload) => tenantApi.inviteUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKSPACE_USERS_KEYS.all });
    },
  });
}

export function useSuspendWorkspaceUser() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<WorkspaceUserInfo>, Error, string>({
    mutationFn: (userId: string) => tenantApi.suspendWorkspaceUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKSPACE_USERS_KEYS.all });
    },
  });
}
