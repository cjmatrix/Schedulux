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
  weekly_crawl_limit: number;
  status: 'active' | 'deprecated' | 'inactive';
  description?: string;
}

export const STATIC_TIER_CONFIGS: Record<string, TierConfig> = {
  starter: {
    tier: 'starter',
    name: 'Starter',
    max_agents: 1,
    max_services: 2,
    max_resources: 2,
    max_kb_docs: 3,
    max_kb_doc_size_mb: 5,
    weekly_token_limit: 100_000,
    rate_limit_rpm: 60,
    weekly_crawl_limit: 5,
    status: 'active',
    description: 'Starter tier for individual operators and evaluation.',
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
    weekly_crawl_limit: 20,
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
    weekly_crawl_limit: 50,
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
    weekly_crawl_limit: -1,
    status: 'active',
    description: 'Unlimited enterprise capability with bespoke rate limits.',
  },
};

export const DEFAULT_TIER = 'starter';

export function getTierConfig(tier?: string | null): TierConfig {
  if (!tier) return STATIC_TIER_CONFIGS.starter;
  const normalized = tier.trim().toLowerCase();
  return STATIC_TIER_CONFIGS[normalized] || STATIC_TIER_CONFIGS.starter;
}
