import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse } from '../../../api/axiosClient';
import {
  scheduleApi,
  type TenantSchedule,
  type UpdateTenantSchedulePayload,
} from '../api/scheduleApi';

export const SCHEDULE_KEYS = {
  all: ['tenant-schedule'] as const,
  detail: (agentId?: string) => ['tenant-schedule', agentId || ''] as const,
};

export function useTenantSchedule(agentId?: string) {
  return useQuery<ApiResponse<TenantSchedule>, Error>({
    queryKey: SCHEDULE_KEYS.detail(agentId),
    queryFn: () => scheduleApi.getSchedule(agentId),
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
