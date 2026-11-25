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
    rate_limit_rpm: 600,
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

export async function resolveTierConfigWithCache(
  cacheRepo: { get: (key: string) => Promise<string | null> },
  tier?: string | null,
): Promise<TierConfig> {
  const fallback = getTierConfig(tier);
  if (!tier || !cacheRepo) return fallback;
  try {
    const raw = await cacheRepo.get(`tier_config:${tier.trim().toLowerCase()}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        tier: String(parsed.tier || fallback.tier),
        name: String(parsed.name || fallback.name),
        max_agents: Number(parsed.max_agents ?? fallback.max_agents),
        max_services: Number(parsed.max_services ?? fallback.max_services),
        max_resources: Number(parsed.max_resources ?? fallback.max_resources),
        max_kb_docs: Number(parsed.max_kb_docs ?? fallback.max_kb_docs),
        max_kb_doc_size_mb: Number(parsed.max_kb_doc_size_mb ?? fallback.max_kb_doc_size_mb),
        weekly_token_limit: Number(parsed.weekly_token_limit ?? fallback.weekly_token_limit),
        rate_limit_rpm: Number(parsed.rate_limit_rpm ?? fallback.rate_limit_rpm),
        status: (parsed.status || fallback.status) as TierConfig['status'],
        description: parsed.description || fallback.description,
      };
    }
  } catch {
    // Non-blocking fallback
  }
  return fallback;
}
