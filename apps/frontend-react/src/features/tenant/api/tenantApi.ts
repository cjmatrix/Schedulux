import type {
  InviteUserRequest,
  InviteUserResponse,
  ListWorkspaceUsersResponse,
  WorkspaceUserInfo,
} from '@repo/proto/dashboard';
import { type ApiResponse, axiosClient } from '../../../api/axiosClient';

export type {
  InviteUserRequest,
  InviteUserResponse,
  ListWorkspaceUsersResponse,
  WorkspaceUserInfo,
};

export const tenantApi = {
  getWorkspaceUsers: async (
    tenantId: string,
    page?: number,
    limit?: number,
    search?: string,
    role?: string,
    agentId?: string,
  ): Promise<ApiResponse<ListWorkspaceUsersResponse>> => {
    const { data } = await axiosClient.get<ApiResponse<ListWorkspaceUsersResponse>>(
      '/api/v1/tenant/auth/workspace-users',
      {
        params: {
          tenant_id: tenantId,
          agent_id: agentId,
          page,
          limit,
          search,
          role: role === 'all' ? undefined : role,
        },
      },
    );
    return data;
  },

  inviteUser: async (payload: InviteUserRequest): Promise<ApiResponse<InviteUserResponse>> => {
    const { data } = await axiosClient.post<ApiResponse<InviteUserResponse>>(
      '/api/v1/tenant/auth/invite-user',
      payload,
    );
    return data;
  },

  suspendWorkspaceUser: async (userId: string): Promise<ApiResponse<WorkspaceUserInfo>> => {
    const { data } = await axiosClient.patch<ApiResponse<WorkspaceUserInfo>>(
      `/api/v1/tenant/auth/workspace-users/${userId}/suspend`,
    );
    return data;
  },
};
