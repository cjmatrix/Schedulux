import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  billingApi,
  type PaddlePublicConfig,
  type SubscriptionDetails,
} from '../api/billingApi';

export const BILLING_KEYS = {
  all: ['billing'] as const,
  subscription: () => ['billing', 'subscription'] as const,
  config: () => ['billing', 'config'] as const,
};

export function useBillingSubscription() {
  return useQuery<SubscriptionDetails, Error>({
    queryKey: BILLING_KEYS.subscription(),
    queryFn: async () => {
      const res = await billingApi.getSubscription();
      return res.data;
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useBillingConfig() {
  return useQuery<PaddlePublicConfig, Error>({
    queryKey: BILLING_KEYS.config(),
    queryFn: async () => {
      const res = await billingApi.getConfig();
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useInvalidateBilling() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: BILLING_KEYS.subscription() });
  };
}

export function useCreateCheckout() {
  return useMutation<{ transaction_id: string }, Error, { plan: string }>({
    mutationFn: async ({ plan }) => {
      const res = await billingApi.createCheckout(plan);
      return res.data;
    },
  });
}

