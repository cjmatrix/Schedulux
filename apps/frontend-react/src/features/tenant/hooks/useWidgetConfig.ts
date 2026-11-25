import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type UpdateWidgetConfigPayload, widgetConfigApi } from '../api/widgetConfigApi';

export const WIDGET_CONFIG_KEYS = {
  all: ['widget_config'] as const,
  detail: (agentId: string, source: string = 'live') =>
    [...WIDGET_CONFIG_KEYS.all, agentId, source] as const,
};

export function useWidgetConfig(
  agentId: string | null | undefined,
  source: 'live' | 'draft' = 'live',
) {
  return useQuery({
    queryKey: WIDGET_CONFIG_KEYS.detail(agentId || '', source),
    queryFn: async () => {
      if (!agentId) return null;
      const res = await widgetConfigApi.getWidgetConfig(agentId, source);
      return res.data;
    },
    enabled: Boolean(agentId),
    staleTime: 30 * 1000,
  });
}

export function useUpdateWidgetConfig(agentId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateWidgetConfigPayload) => {
      if (!agentId) throw new Error('Agent ID is required');
      const res = await widgetConfigApi.updateWidgetConfig(agentId, payload);
      return res.data;
    },
    onSuccess: () => {
      if (agentId) {
        queryClient.invalidateQueries({
          queryKey: WIDGET_CONFIG_KEYS.detail(agentId, 'live'),
        });
        queryClient.invalidateQueries({
          queryKey: WIDGET_CONFIG_KEYS.detail(agentId, 'draft'),
        });
      }
    },
  });
}
