import { Check } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router';
import { PublicLayout } from '../components/PublicLayout';
import type { TierConfig } from '../features/tenant/api/billingApi';
import { usePublicTiers } from '../features/tenant/hooks/useBilling';

const TIER_ORDER = ['starter', 'pro', 'business', 'enterprise'] as const;

const PLAN_META: Record<
  string,
  { price: string; period: string; badge?: string; highlighted?: boolean; cta: string }
> = {
  starter: { price: '$0', period: '/month', cta: 'Start Free' },
  pro: { price: '$29', period: '/month', cta: 'Get Started' },
  business: {
    price: '$79',
    period: '/month',
    badge: 'Most Popular',
    highlighted: true,
    cta: 'Get Started',
  },
  enterprise: { price: '$199', period: '/month', cta: 'Contact Sales' },
};

const FALLBACK_TIERS: Record<string, TierConfig> = {
  starter: {
    tier: 'starter',
    name: 'Starter',
    max_agents: 1,
    max_services: 2,
    max_resources: 2,
    max_kb_docs: 3,
    max_kb_doc_size_mb: 5,
    weekly_token_limit: 50_000,
    rate_limit_rpm: 60,
    weekly_crawl_limit: 5,
    status: 'active',
    description: 'For solo practitioners testing AI scheduling in a live sandbox.',
  },
  pro: {
    tier: 'pro',
    name: 'Pro',
    max_agents: 3,
    max_services: 15,
    max_resources: 10,
    max_kb_docs: 15,
    max_kb_doc_size_mb: 15,
    weekly_token_limit: 300_000,
    rate_limit_rpm: 120,
    weekly_crawl_limit: 15,
    status: 'active',
    description: 'For growing clinics, salons, and studios automating daily bookings.',
  },
  business: {
    tier: 'business',
    name: 'Business',
    max_agents: 10,
    max_services: 50,
    max_resources: 30,
    max_kb_docs: 50,
    max_kb_doc_size_mb: 25,
    weekly_token_limit: 1_000_000,
    rate_limit_rpm: 300,
    weekly_crawl_limit: 50,
    status: 'active',
    description: 'For multi-location teams needing RBAC and high concurrency.',
  },
  enterprise: {
    tier: 'enterprise',
    name: 'Enterprise',
    max_agents: -1,
    max_services: -1,
    max_resources: -1,
    max_kb_docs: -1,
    max_kb_doc_size_mb: 50,
    weekly_token_limit: -1,
    rate_limit_rpm: 1000,
    weekly_crawl_limit: -1,
    status: 'active',
    description: 'Unlimited scale with bespoke rate limits and dedicated support.',
  },
};

function formatLimit(value: number, singular: string, plural?: string): string {
  if (value < 0) return `Unlimited ${plural || `${singular}s`}`;
  return `${value.toLocaleString()} ${value === 1 ? singular : plural || `${singular}s`}`;
}

export default function PricingPage() {
  const { data: liveTiers } = usePublicTiers();

  const plans = useMemo(() => {
    const source = liveTiers && Object.keys(liveTiers).length > 0 ? liveTiers : FALLBACK_TIERS;
    return TIER_ORDER.map((key) => source[key])
      .filter((t): t is TierConfig => Boolean(t) && t.status !== 'inactive')
      .map((tier) => {
        const meta = PLAN_META[tier.tier] || { price: 'Custom', period: '', cta: 'Get Started' };
        return {
          key: tier.tier,
          name: tier.name,
          price: meta.price,
          period: meta.period,
          badge: meta.badge,
          highlighted: Boolean(meta.highlighted),
          cta: meta.cta,
          description: tier.description || FALLBACK_TIERS[tier.tier]?.description || '',
          features: [
            formatLimit(tier.max_agents, 'AI Booking Agent'),
            `${formatLimit(tier.max_services, 'service')} & ${formatLimit(tier.max_resources, 'resource')}`,
            `${formatLimit(tier.max_kb_docs, 'knowledge doc')} (${tier.max_kb_doc_size_mb} MB max)`,
            tier.weekly_token_limit < 0
              ? 'Unlimited weekly AI tokens'
              : `${tier.weekly_token_limit.toLocaleString()} weekly AI tokens`,
            `${tier.rate_limit_rpm.toLocaleString()} req/min widget rate limit`,
          ],
        };
      });
  }, [liveTiers]);

  return (
    <PublicLayout>
      <main className="max-w-7xl mx-auto px-6 sm:px-8 pt-16 pb-24 space-y-16">
        <section className="max-w-2xl space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Pricing</p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-950">
            Simple plans that scale with your bookings
          </h1>
          <p className="text-base text-neutral-500">
            Start free in the Agent Builder Studio and upgrade only when your team needs more
            agents, higher token budgets, or workspace managers.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`rounded-3xl p-7 flex flex-col justify-between gap-8 ${
                plan.highlighted
                  ? 'bg-neutral-950 text-white border border-neutral-950 shadow-xl'
                  : 'bg-white text-neutral-900 border border-neutral-200'
              }`}
            >
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-lg font-bold">{plan.name}</h2>
                    {plan.badge && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
                    <span
                      className={`text-xs ${plan.highlighted ? 'text-neutral-400' : 'text-neutral-500'}`}
                    >
                      {plan.period}
                    </span>
                  </div>
                  <p
                    className={`mt-3 text-xs leading-relaxed ${
                      plan.highlighted ? 'text-neutral-300' : 'text-neutral-500'
                    }`}
                  >
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-2.5 text-xs">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5">
                      <Check
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          plan.highlighted ? 'text-emerald-400' : 'text-emerald-600'
                        }`}
                      />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                to="/register"
                className={`w-full text-center rounded-full py-3 text-xs font-semibold transition ${
                  plan.highlighted
                    ? 'bg-white text-neutral-950 hover:bg-neutral-200'
                    : 'bg-neutral-950 text-white hover:bg-neutral-800'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </section>
      </main>
    </PublicLayout>
  );
}
