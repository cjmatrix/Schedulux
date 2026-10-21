import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse } from '../../../api/axiosClient';
import type {
  InviteUserRequest,
  InviteUserResponse,
  ListWorkspaceUsersResponse,
} from '../api/tenantApi';
import { tenantApi } from '../api/tenantApi';

export function useWorkspaceUsers(
  tenantId: string,
  page?: number,
  limit?: number,
  search?: string,
  role?: string,
) {
  return useQuery<ApiResponse<ListWorkspaceUsersResponse>, Error>({
    queryKey: ['workspaceUsers', tenantId, page, limit, search, role],
    queryFn: () => tenantApi.getWorkspaceUsers(tenantId, page, limit, search, role),
    enabled: Boolean(tenantId),
    staleTime: 30 * 1000,
  });
}

export function useInviteUser() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<InviteUserResponse>, Error, InviteUserRequest>({
    mutationFn: (payload) => tenantApi.inviteUser(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workspaceUsers', variables.tenant_id] });
    },
  });
}
