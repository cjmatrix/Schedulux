import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  tierConfigApi,
  type TierConfigData,
  type UpdateTierConfigPayload,
} from '../api/tierConfigApi';

export const TIER_CONFIG_KEYS = {
  all: ['superadmin-tier-configs'] as const,
  lists: () => [...TIER_CONFIG_KEYS.all, 'list'] as const,
  detail: (tier: string) => [...TIER_CONFIG_KEYS.all, 'detail', tier] as const,
};

export function useTierConfigs() {
  return useQuery<TierConfigData[], Error>({
    queryKey: TIER_CONFIG_KEYS.lists(),
    queryFn: () => tierConfigApi.getTierConfigs(),
    staleTime: 30 * 1000,
  });
}

export function useTierConfig(tier: string) {
  return useQuery<TierConfigData, Error>({
    queryKey: TIER_CONFIG_KEYS.detail(tier),
    queryFn: () => tierConfigApi.getTierConfigByTier(tier),
    enabled: Boolean(tier),
    staleTime: 30 * 1000,
  });
}

export function useUpdateTierConfig() {
  const queryClient = useQueryClient();

  return useMutation<TierConfigData, Error, { tier: string; payload: UpdateTierConfigPayload }>({
    mutationFn: ({ tier, payload }) => tierConfigApi.updateTierConfig(tier, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: TIER_CONFIG_KEYS.all });
      void queryClient.invalidateQueries({ queryKey: TIER_CONFIG_KEYS.detail(variables.tier) });
    },
  });
}
