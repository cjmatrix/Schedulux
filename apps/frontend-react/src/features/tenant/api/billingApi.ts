import { axiosClient, type ApiResponse } from '../../../api/axiosClient';

export interface TierConfig {
  tier: string;
  name: string;
  max_agents: number;
  max_services: number;
  max_resources: number;
  max_kb_docs: number;
  max_kb_doc_size_mb: number;
  weekly_token_limit: number;
  rate_limit_rpm: number;
  status: string;
  description?: string;
}

export interface SubscriptionUsage {
  weekly_tokens: number;
}

export interface SubscriptionDetails {
  tenant_id: string;
  tier: 'starter' | 'pro' | 'business' | 'enterprise';
  status: string;
  paddle_customer_id: string | null;
  paddle_subscription_id: string | null;
  tier_config: TierConfig;
  usage: SubscriptionUsage;
  all_tiers: Record<string, TierConfig>;
}

export interface PaddlePublicConfig {
  environment: 'sandbox' | 'production';
  client_token: string;
  prices: {
    pro: string;
    business: string;
    enterprise: string;
  };
}

export const billingApi = {
  getSubscription: async (): Promise<ApiResponse<SubscriptionDetails>> => {
    const response = await axiosClient.get<ApiResponse<SubscriptionDetails>>(
      '/api/v1/tenant/billing/subscription',
    );
    return response.data;
  },

  getConfig: async (): Promise<ApiResponse<PaddlePublicConfig>> => {
    const response = await axiosClient.get<ApiResponse<PaddlePublicConfig>>(
      '/api/v1/tenant/billing/config',
    );
    return response.data;
  },

  createCheckout: async (plan: string): Promise<ApiResponse<{ transaction_id: string }>> => {
    const response = await axiosClient.post<ApiResponse<{ transaction_id: string }>>(
      '/api/v1/tenant/billing/checkout',
      { plan },
    );
    return response.data;
  },
};
