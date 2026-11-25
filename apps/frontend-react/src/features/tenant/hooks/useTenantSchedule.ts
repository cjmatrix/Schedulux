import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse } from '../../../api/axiosClient';
import {
  scheduleApi,
  type TenantSchedule,
  type UpdateTenantSchedulePayload,
} from '../api/scheduleApi';

export const SCHEDULE_KEYS = {
  all: ['tenant-schedule'] as const,
  detail: (agentId?: string) => ['tenant-schedule', agentId?.trim() || ''] as const,
};

export function useTenantSchedule(agentId?: string) {
  const cleanAgentId = agentId?.trim() || '';
  return useQuery<ApiResponse<TenantSchedule>, Error>({
    queryKey: SCHEDULE_KEYS.detail(cleanAgentId),
    queryFn: () => scheduleApi.getSchedule(cleanAgentId),
    enabled: Boolean(cleanAgentId),
    staleTime: 30 * 1000,
  });
}

export function useUpdateTenantSchedule() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<TenantSchedule>, Error, UpdateTenantSchedulePayload>({
    mutationFn: (payload) => scheduleApi.updateSchedule(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: SCHEDULE_KEYS.all });
      queryClient.invalidateQueries({ queryKey: SCHEDULE_KEYS.detail(variables.agent_id) });
    },
  });
}
