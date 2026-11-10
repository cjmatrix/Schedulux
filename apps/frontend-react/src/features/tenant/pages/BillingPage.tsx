import { initializePaddle, type Paddle } from '@paddle/paddle-js';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Cpu,
  CreditCard,
  ExternalLink,
  HelpCircle,
  Loader2,
  type LucideIcon,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { toast } from 'sonner';
import {
  useBillingConfig,
  useBillingSubscription,
  useCreateCheckout,
  useInvalidateBilling,
} from '../hooks/useBilling';

interface PlanDefinition {
  key: 'starter' | 'pro' | 'business' | 'enterprise';
  name: string;
  price: string;
  period: string;
  badge?: string;
  isPopular?: boolean;
  description: string;
  features: string[];
  limits: {
    agents: string;
    services: string;
    resources: string;
    kbDocs: string;
    tokens: string;
    rateLimit: string;
  };
}

const PLANS: PlanDefinition[] = [
  {
    key: 'starter',
    name: 'Starter',
    price: '$0',
    period: 'forever',
    badge: 'Free Tier',
    description: 'Perfect for exploring Schedulux and launching your first AI scheduling agent.',
    features: [
      '1 AI Scheduling Agent',
      'Up to 5 Bookable Services',
      '3 Inventory / Staff Resources',
      '3 Knowledge Base Documents (5 MB max)',
      '100,000 Weekly AI Tokens',
      '60 Requests / Minute API Rate Limit',
      'Community & Standard Support',
    ],
    limits: {
      agents: '1 Agent',
      services: '5 Services',
      resources: '3 Resources',
      kbDocs: '3 Docs',
      tokens: '100k / wk',
      rateLimit: '60 RPM',
    },
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '$29',
    period: 'per month',
    description: 'Designed for growing single-location businesses requiring higher concurrency.',
    features: [
      '2 AI Scheduling Agents',
      'Up to 15 Bookable Services',
      '10 Inventory / Staff Resources',
      '10 Knowledge Base Documents (25 MB max)',
      '500,000 Weekly AI Tokens',
      '120 Requests / Minute API Rate Limit',
      'Priority Email Support',
      'Custom Brand Styling',
    ],
    limits: {
      agents: '2 Agents',
      services: '15 Services',
      resources: '10 Resources',
      kbDocs: '10 Docs',
      tokens: '500k / wk',
      rateLimit: '120 RPM',
    },
  },
  {
    key: 'business',
    name: 'Business',
    price: '$79',
    period: 'per month',
    badge: 'Most Popular',
    isPopular: true,
    description: 'High-capacity infrastructure for established multi-location practices.',
    features: [
      '5 AI Scheduling Agents',
      'Up to 50 Bookable Services',
      '50 Inventory / Staff Resources',
      '50 Knowledge Base Documents (100 MB max)',
      '2,500,000 Weekly AI Tokens',
      '300 Requests / Minute API Rate Limit',
      'Multi-staff Workspace Collaboration',
      'Fast-track Customer Support',
    ],
    limits: {
      agents: '5 Agents',
      services: '50 Services',
      resources: '50 Resources',
      kbDocs: '50 Docs',
      tokens: '2.5M / wk',
      rateLimit: '300 RPM',
    },
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    price: '$199',
    period: 'per month',
    description: 'Bespoke high-volume capacity with unlimited quotas and custom SLAs.',
    features: [
      'Unlimited AI Scheduling Agents',
      'Unlimited Services & Calendars',
      'Unlimited Resources & Staff',
      'Unlimited Knowledge Base Docs (250 MB max)',
      'Unlimited Weekly AI Tokens',
      '1,000 Requests / Minute API Rate Limit',
      'Dedicated Account Manager & Bespoke SLA',
      'Custom Domain & Webhooks',
    ],
    limits: {
      agents: 'Unlimited',
      services: 'Unlimited',
      resources: 'Unlimited',
      kbDocs: 'Unlimited',
      tokens: 'Unlimited',
      rateLimit: '1,000 RPM',
    },
  },
];

export default function BillingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const paymentSuccess = searchParams.get('payment') === 'success';

  const { data: subscription, isLoading: isSubLoading, refetch } = useBillingSubscription();
  const { data: paddleConfig } = useBillingConfig();
  const invalidateBilling = useInvalidateBilling();
  const createCheckoutMutation = useCreateCheckout();

  const [paddleInstance, setPaddleInstance] = useState<Paddle | null>(null);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

 
  useEffect(() => {
    let isMounted = true;

    if (paddleInstance || !paddleConfig?.client_token) return;
    
    if (paddleConfig?.client_token) {
      initializePaddle({
        environment: 'sandbox',
        token: paddleConfig.client_token,
      })
        .then((paddle) => {
          if (isMounted && paddle) {
            setPaddleInstance(paddle);
          }
        })
        .catch((err) => {
          console.warn('[Paddle.js] Initialization warning:', err);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [paddleConfig?.client_token,paddleInstance]);

 
  useEffect(() => {
    if (paymentSuccess) {
      toast.success('Payment completed successfully! Refreshing your subscription status...');
      invalidateBilling();
      const timer = setTimeout(() => {
        searchParams.delete('payment');
        setSearchParams(searchParams, { replace: true });
        refetch();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [paymentSuccess, invalidateBilling, refetch, searchParams, setSearchParams]);

  const currentTier = (subscription?.tier || 'starter').toLowerCase();

  const handleCheckout = async (plan: PlanDefinition) => {
    if (plan.key === currentTier) {
      toast.info(`You are currently on the ${plan.name} plan.`);
      return;
    }

    if (plan.key === 'starter') {
      toast.info('Starter is the free baseline plan.');
      return;
    }

    const clientToken = paddleConfig?.client_token;
    if (!clientToken) {
      setShowGuide(true);
      toast.error(
        'Paddle Client Token is not yet configured. Please set PADDLE_CLIENT_TOKEN in the backend .env.',
        { duration: 6000 },
      );
      return;
    }

    setLoadingTier(plan.key);

    try {
      let paddle = paddleInstance;
      if (!paddle) {
        const initialized = await initializePaddle({
          environment: 'sandbox',
          token: clientToken,
        });
        paddle = initialized ?? null;
        if (paddle) setPaddleInstance(paddle);
      }

      if (!paddle) {
        throw new Error('Unable to initialize Paddle SDK');
      }

     
      const checkoutRes = await createCheckoutMutation.mutateAsync({ plan: plan.key });

      paddle.Checkout.open({
        transactionId: checkoutRes.transaction_id,
        settings: {
          displayMode: 'overlay',
          theme: 'light',
          successUrl: `${window.location.origin}/tenant/billing?payment=success`,
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to launch checkout';
      toast.error(msg);
    } finally {
      setLoadingTier(null);
    }
  };

  const renderMeter = (
    label: string,
    current: number,
    max: number,
    IconComponent: LucideIcon,
    unit = '',
  ) => {
    const isUnlimited = max === -1;
    const percentage = isUnlimited ? 20 : Math.min(100, Math.round((current / max) * 100));
    const isNearLimit = !isUnlimited && percentage >= 80;
    const isAtLimit = !isUnlimited && current >= max;

    return (
      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700/60">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <IconComponent className="w-4 h-4 text-primary-500" />
            <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {current.toLocaleString()} {unit} /{' '}
            {isUnlimited ? 'Unlimited' : `${max.toLocaleString()} ${unit}`}
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isAtLimit
                ? 'bg-rose-500'
                : isNearLimit
                  ? 'bg-amber-500'
                  : 'bg-primary-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {isAtLimit && (
          <p className="mt-1 text-[11px] text-rose-500 font-medium">
            Limit reached. Upgrade plan to expand quota.
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Payment Success Alert */}
      {paymentSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between dark:bg-emerald-950/30 dark:border-emerald-800">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                Paddle Subscription Successful!
              </h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Your payment was received in Paddle Sandbox and workspace quotas have been upgraded.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Subscription & Billing
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
              Paddle Sandbox
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Workspace quotas are pooled and shared across all AI agents in your account.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition shadow-sm"
          >
            <HelpCircle className="w-4 h-4 text-primary-500" />
            Paddle Setup Guide
          </button>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isSubLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSubLoading ? 'animate-spin' : ''}`} />
            Sync Status
          </button>
        </div>
      </div>

      {/* Paddle Setup Help Accordion */}
      {showGuide && (
        <div className="bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 rounded-2xl p-6 transition">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5 text-blue-900 dark:text-blue-300 font-semibold text-base">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Paddle Sandbox Setup Checklist
            </div>
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Dismiss
            </button>
          </div>
          <p className="text-xs text-blue-800 dark:text-blue-300/80 mt-1 mb-4">
            You already created products <code>S-pro</code>, <code>S-business</code>, and{' '}
            <code>S-enterprise</code> in your Paddle Sandbox. Follow these 3 simple steps to complete
            the live sandbox flow:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-blue-200/60 dark:border-blue-800/40">
              <span className="font-bold text-slate-900 dark:text-white block mb-1">
                1. Prices for Products
              </span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Click into <code>S-pro</code>, <code>S-business</code>, and <code>S-enterprise</code> in{' '}
                <a
                  href="https://sandbox-vendors.paddle.com/products-v2"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary-600 dark:text-primary-400 underline inline-flex items-center gap-0.5"
                >
                  Products <ExternalLink className="w-3 h-3" />
                </a>
                . Click <strong>Add Price</strong> (e.g. $29/mo, $79/mo, $199/mo). Copy the Price IDs (
                <code>pri_...</code>) to your <code>.env</code>:
              </p>
              <pre className="mt-2 p-2 bg-slate-100 dark:bg-slate-900 rounded font-mono text-[10px] overflow-x-auto">
                PADDLE_PRICE_ID_PRO=pri_...{'\n'}
                PADDLE_PRICE_ID_BUSINESS=pri_...{'\n'}
                PADDLE_PRICE_ID_ENTERPRISE=pri_...
              </pre>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-blue-200/60 dark:border-blue-800/40">
              <span className="font-bold text-slate-900 dark:text-white block mb-1">
                2. Client-Side Token
              </span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                In Paddle Sandbox, navigate to <strong>Developer Tools &rarr; Authentication</strong>.
                Generate a <strong>Client-side token</strong> (starts with <code>test_...</code>) so
                Paddle.js can display the overlay checkout modal:
              </p>
              <pre className="mt-2 p-2 bg-slate-100 dark:bg-slate-900 rounded font-mono text-[10px] overflow-x-auto">
                PADDLE_CLIENT_TOKEN=test_...
              </pre>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-blue-200/60 dark:border-blue-800/40">
              <span className="font-bold text-slate-900 dark:text-white block mb-1">
                3. Webhook Notification
              </span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Go to <strong>Developer Tools &rarr; Notifications</strong>. Click{' '}
                <strong>New destination</strong>. Set URL to:
                <br />
                <code>https://your-domain/api/v1/tenant/billing/webhook</code>
                <br />
                Copy the <strong>Webhook Secret Key</strong> (<code>pdl_ntfset_...</code>):
              </p>
              <pre className="mt-2 p-2 bg-slate-100 dark:bg-slate-900 rounded font-mono text-[10px] overflow-x-auto">
                PADDLE_WEBHOOK_SECRET=pdl_ntfset_...
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Current Subscription & Resource Quota Overview */}
      <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-950/40 border border-primary-200/60 dark:border-primary-800/60 flex items-center justify-center text-primary-600 dark:text-primary-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
                  {currentTier} Plan
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                  {subscription?.status || 'Active'}
                </span>
                {currentTier === 'starter' && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    Free Tier
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {subscription?.tier_config?.description ||
                  'Active workspace subscription and rate limit configuration.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                Workspace Rate Limit
              </span>
              <span>{subscription?.tier_config?.rate_limit_rpm || 60} RPM</span>
            </div>
            <div className="border-l border-slate-200 dark:border-slate-700 pl-4">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                Billing Method
              </span>
              <span>
                {subscription?.paddle_subscription_id ? 'Paddle Sandbox' : 'Default Workspace'}
              </span>
            </div>
          </div>
        </div>

        {/* Weekly Token Usage Overview */}
        <div className="pt-2">
          {renderMeter(
            'Weekly AI Token Quota',
            subscription?.usage?.weekly_tokens || 0,
            subscription?.tier_config?.weekly_token_limit ?? 100000,
            Cpu,
            'tokens',
          )}
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="space-y-4">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Available Workspace Plans
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Upgrade your workspace at any time to unlock additional AI agents, services, resources, and
            tokens.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
          {PLANS.map((plan) => {
            const isCurrent = currentTier === plan.key;
            const isLoading = loadingTier === plan.key;

            return (
              <div
                key={plan.key}
                className={`relative rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between ${
                  plan.isPopular
                    ? 'border-2 border-primary-500 bg-white dark:bg-slate-850 shadow-xl shadow-primary-500/10'
                    : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Popular / Current Badge */}
                {plan.isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 text-[11px] font-bold tracking-wider uppercase rounded-full bg-primary-600 text-white shadow-md">
                      Most Popular
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {plan.name}
                    </h3>
                    {isCurrent && (
                      <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        Current
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 min-h-[36px] mb-4">
                    {plan.description}
                  </p>

                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                      {plan.price}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      /{plan.period}
                    </span>
                  </div>

                  {/* Quota Highlights Table */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 mb-6 space-y-1.5 text-xs border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>AI Agents:</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-200">
                        {plan.limits.agents}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Services:</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-200">
                        {plan.limits.services}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Resources:</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-200">
                        {plan.limits.resources}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Weekly Tokens:</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-200">
                        {plan.limits.tokens}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Rate Limit:</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-200">
                        {plan.limits.rateLimit}
                      </span>
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-2 mb-6">
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-200 block mb-2">
                      Included in {plan.name}:
                    </span>
                    {plan.features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400"
                      >
                        <Check className="w-3.5 h-3.5 text-primary-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Call-to-Action Button */}
                <button
                  type="button"
                  onClick={() => handleCheckout(plan)}
                  disabled={isCurrent || isLoading}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-sm ${
                    isCurrent
                      ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'
                      : plan.isPopular
                        ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-500/20'
                        : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Opening Paddle Checkout...
                    </>
                  ) : isCurrent ? (
                    'Current Plan'
                  ) : plan.key === 'starter' ? (
                    'Free Baseline'
                  ) : (
                    <>
                      Upgrade to {plan.name}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security & Paddle Compliance Footer */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <CreditCard className="w-5 h-5 text-slate-400" />
          <span>
            Payments are securely processed through{' '}
            <strong className="text-slate-700 dark:text-slate-300">Paddle Sandbox</strong>. All major
            credit cards, PayPal, and Apple Pay are supported.
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            PCI-DSS Level 1 Certified
          </span>
          <span className="flex items-center gap-1">
            <Zap className="w-4 h-4 text-primary-500" />
            Instant Provisioning
          </span>
        </div>
      </div>
    </div>
  );
}

