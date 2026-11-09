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
  status: 'active' | 'deprecated' | 'inactive';
  description?: string;
}

export const STATIC_TIER_CONFIGS: Record<string, TierConfig> = {
  free: {
    tier: 'free',
    name: 'Free Starter',
    max_agents: 1,
    max_services: 5,
    max_resources: 3,
    max_kb_docs: 3,
    max_kb_doc_size_mb: 5,
    weekly_token_limit: 100_000,
    rate_limit_rpm: 60,
    status: 'active',
    description: 'Entry-level tier for individual operators and evaluation.',
  },
  starter: {
    tier: 'starter',
    name: 'Starter',
    max_agents: 1,
    max_services: 5,
    max_resources: 3,
    max_kb_docs: 3,
    max_kb_doc_size_mb: 5,
    weekly_token_limit: 100_000,
    rate_limit_rpm: 60,
    status: 'active',
    description: 'Starter tier matching free tier specifications.',
  },
  pro: {
    tier: 'pro',
    name: 'Pro',
    max_agents: 2,
    max_services: 15,
    max_resources: 10,
    max_kb_docs: 10,
    max_kb_doc_size_mb: 25,
    weekly_token_limit: 500_000,
    rate_limit_rpm: 120,
    status: 'active',
    description: 'Professional tier for growing businesses with multiple services.',
  },
  business: {
    tier: 'business',
    name: 'Business',
    max_agents: 5,
    max_services: 50,
    max_resources: 50,
    max_kb_docs: 50,
    max_kb_doc_size_mb: 100,
    weekly_token_limit: 2_500_000,
    rate_limit_rpm: 300,
    status: 'active',
    description: 'High-capacity tier for established multi-location practices.',
  },
  enterprise: {
    tier: 'enterprise',
    name: 'Enterprise',
    max_agents: -1,
    max_services: -1,
    max_resources: -1,
    max_kb_docs: -1,
    max_kb_doc_size_mb: 250,
    weekly_token_limit: -1,
    rate_limit_rpm: 1000,
    status: 'active',
    description: 'Unlimited enterprise capability with bespoke rate limits.',
  },
};

export const DEFAULT_TIER = 'free';

export function getTierConfig(tier?: string | null): TierConfig {
  if (!tier) return STATIC_TIER_CONFIGS.free;
  const normalized = tier.trim().toLowerCase();
  return STATIC_TIER_CONFIGS[normalized] || STATIC_TIER_CONFIGS.free;
}

