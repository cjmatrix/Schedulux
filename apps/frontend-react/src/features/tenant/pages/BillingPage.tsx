import { initializePaddle, type Paddle } from '@paddle/paddle-js';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Cpu,
  CreditCard,
  ExternalLink,
  Loader2,
  type LucideIcon,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
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
  agentLimit: string;
  features: string[];
}

const PLANS: PlanDefinition[] = [
  {
    key: 'starter',
    name: 'Starter',
    price: '$0',
    period: 'forever',
    badge: 'Free Tier',
    description: 'Starter tier matching free tier specifications.',
    agentLimit: '1 Agent',
    features: [
      'Up to 2 Bookable Services',
      'Up to 2 Staff / Inventory Resources',
      '3 Knowledge Base Documents (5 MB max each)',
      '100,000 Weekly AI Tokens',
      '60 Requests / Minute API Rate Limit',
    ],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '$29',
    period: 'per month',
    description: 'Professional tier for growing businesses with multiple services.',
    agentLimit: '2 Agents',
    features: [
      'Up to 15 Bookable Services',
      'Up to 10 Staff / Inventory Resources',
      '10 Knowledge Base Documents (25 MB max each)',
      '500,000 Weekly AI Tokens',
      '120 Requests / Minute API Rate Limit',
    ],
  },
  {
    key: 'business',
    name: 'Business',
    price: '$79',
    period: 'per month',
    badge: 'Most Popular',
    isPopular: true,
    description: 'High-capacity tier for established multi-location practices.',
    agentLimit: '5 Agents',
    features: [
      'Up to 50 Bookable Services',
      'Up to 50 Staff / Inventory Resources',
      '50 Knowledge Base Documents (100 MB max each)',
      '2,500,000 Weekly AI Tokens',
      '300 Requests / Minute API Rate Limit',
    ],
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    price: '$199',
    period: 'per month',
    description: 'Unlimited enterprise capability with bespoke rate limits.',
    agentLimit: 'Unlimited',
    features: [
      'Unlimited Bookable Services',
      'Unlimited Staff / Inventory Resources',
      'Unlimited Knowledge Base Docs (250 MB max each)',
      'Unlimited Weekly AI Tokens',
      '1,000 Requests / Minute API Rate Limit',
    ],
  },
];

export default function BillingPage() {
  const { agentId: routeAgentId } = useParams<{ agentId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentAgentId = routeAgentId || searchParams.get('agent_id') || undefined;
  const paymentSuccess = searchParams.get('payment') === 'success';

  const { data: subscription, isLoading: isSubLoading, refetch } = useBillingSubscription();
  const { data: paddleConfig } = useBillingConfig();
  const invalidateBilling = useInvalidateBilling();
  const createCheckoutMutation = useCreateCheckout();

  const [paddleInstance, setPaddleInstance] = useState<Paddle | null>(null);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(paymentSuccess);
  const hasHandledSuccessRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    if (paddleInstance || !paddleConfig?.client_token) return;

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

    return () => {
      isMounted = false;
    };
  }, [paddleConfig?.client_token, paddleInstance]);

  useEffect(() => {
    if (paymentSuccess && !hasHandledSuccessRef.current) {
      hasHandledSuccessRef.current = true;
      setShowSuccessBanner(true);
      toast.success('Payment completed successfully! Subscription status updated.');
      invalidateBilling();

      
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('payment');
      setSearchParams(nextParams, { replace: true });
    }
  }, [paymentSuccess, invalidateBilling, searchParams, setSearchParams]);

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
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-slate-700">
            <IconComponent className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
          </div>
          <span className="text-xs font-medium text-slate-500">
            {current.toLocaleString()} {unit} /{' '}
            {isUnlimited ? 'Unlimited' : `${max.toLocaleString()} ${unit}`}
          </span>
        </div>
        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isAtLimit
                ? 'bg-rose-500'
                : isNearLimit
                  ? 'bg-amber-500'
                  : 'bg-blue-600'
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
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto flex flex-col gap-6 sm:gap-8 font-sans">
      {/* Payment Success Alert */}
      {showSuccessBanner && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-emerald-950">
                Paddle Subscription Successful!
              </h4>
              <p className="text-xs text-emerald-800">
                Your payment was received in Paddle Sandbox and workspace quotas have been upgraded.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <button
              type="button"
              onClick={() => refetch()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setShowSuccessBanner(false)}
              className="text-xs text-emerald-700 hover:text-emerald-900 px-2 py-1 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 sm:pb-6 border-b border-slate-200">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <div className="p-1.5 sm:p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-slate-900">
              Subscription &amp; Billing
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
              Paddle Sandbox
            </span>
            {currentAgentId && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                Agent: {currentAgentId.slice(-6)}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Workspace quotas are pooled and shared across all AI agents in your account.
          </p>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap shrink-0 self-start sm:self-center">
         
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isSubLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl bg-slate-950 text-white hover:bg-black transition shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSubLoading ? 'animate-spin' : ''}`} />
            Sync Status
          </button>
        </div>
      </div>

      {/* Paddle Setup Help Accordion */}
      {showGuide && (
        <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-6 transition">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5 text-blue-900 font-semibold text-base">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Paddle Sandbox Setup Checklist
            </div>
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="text-xs font-medium text-blue-600 hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
          <p className="text-xs text-blue-800 mt-1 mb-4">
            You already created products <code>S-pro</code>, <code>S-business</code>, and{' '}
            <code>S-enterprise</code> in your Paddle Sandbox. Follow these 3 simple steps to complete
            the live sandbox flow:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-white p-4 rounded-xl border border-blue-200/60 shadow-xs">
              <span className="font-bold text-slate-900 block mb-1">
                1. Prices for Products
              </span>
              <p className="text-slate-600 leading-relaxed">
                Click into <code>S-pro</code>, <code>S-business</code>, and <code>S-enterprise</code> in{' '}
                <a
                  href="https://sandbox-vendors.paddle.com/products-v2"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline inline-flex items-center gap-0.5"
                >
                  Products <ExternalLink className="w-3 h-3" />
                </a>
                . Click <strong>Add Price</strong> (e.g. $29/mo, $79/mo, $199/mo). Copy the Price IDs (
                <code>pri_...</code>) to your <code>.env</code>:
              </p>
              <pre className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded font-mono text-[10px] text-slate-800 overflow-x-auto">
                PADDLE_PRICE_ID_PRO=pri_...{'\n'}
                PADDLE_PRICE_ID_BUSINESS=pri_...{'\n'}
                PADDLE_PRICE_ID_ENTERPRISE=pri_...
              </pre>
            </div>

            <div className="bg-white p-4 rounded-xl border border-blue-200/60 shadow-xs">
              <span className="font-bold text-slate-900 block mb-1">
                2. Client-Side Token
              </span>
              <p className="text-slate-600 leading-relaxed">
                In Paddle Sandbox, navigate to <strong>Developer Tools &rarr; Authentication</strong>.
                Generate a <strong>Client-side token</strong> (starts with <code>test_...</code>) so
                Paddle.js can display the overlay checkout modal:
              </p>
              <pre className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded font-mono text-[10px] text-slate-800 overflow-x-auto">
                PADDLE_CLIENT_TOKEN=test_...
              </pre>
            </div>

            <div className="bg-white p-4 rounded-xl border border-blue-200/60 shadow-xs">
              <span className="font-bold text-slate-900 block mb-1">
                3. Webhook Notification
              </span>
              <p className="text-slate-600 leading-relaxed">
                Go to <strong>Developer Tools &rarr; Notifications</strong>. Click{' '}
                <strong>New destination</strong>. Set URL to:
                <br />
                <code className="text-blue-700 font-mono">https://your-domain/api/v1/tenant/billing/webhook</code>
                <br />
                Copy the <strong>Webhook Secret Key</strong> (<code>pdl_ntfset_...</code>):
              </p>
              <pre className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded font-mono text-[10px] text-slate-800 overflow-x-auto">
                PADDLE_WEBHOOK_SECRET=pdl_ntfset_...
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Current Subscription & Resource Quota Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 capitalize">
                  {currentTier} Plan
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {subscription?.status || 'Active'}
                </span>
                {currentTier === 'starter' && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    Free Tier
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {subscription?.tier_config?.description ||
                  'Active workspace subscription and rate limit configuration.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <div>
              <span className="font-semibold text-slate-700 block">
                Workspace Rate Limit
              </span>
              <span>{subscription?.tier_config?.rate_limit_rpm || 60} RPM</span>
            </div>
            <div className="border-l border-slate-200 pl-4">
              <span className="font-semibold text-slate-700 block">
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
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Available Workspace Plans
          </h2>
          <p className="text-sm text-slate-500">
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
                className={`relative rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between bg-white ${
                  plan.isPopular
                    ? 'border-2 border-blue-600 shadow-xl shadow-blue-500/10 ring-1 ring-blue-600/20'
                    : 'border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300'
                }`}
              >
                {/* Popular Badge */}
                {plan.isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 text-[11px] font-bold tracking-wider uppercase rounded-full bg-blue-600 text-white shadow-md">
                      Most Popular
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-slate-900">
                      {plan.name}
                    </h3>
                    {isCurrent && (
                      <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-slate-100 text-slate-800 border border-slate-300">
                        Current
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 min-h-[36px] mb-4 leading-relaxed">
                    {plan.description}
                  </p>

                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-3xl font-extrabold text-slate-900">
                      {plan.price}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      /{plan.period}
                    </span>
                  </div>

                  {/* AI Agents Highlight */}
                  <div className="bg-slate-50 rounded-xl px-3.5 py-2.5 mb-6 flex justify-between items-center text-xs border border-slate-200/80">
                    <span className="font-medium text-slate-600">AI Agents:</span>
                    <span className="font-semibold text-slate-900">
                      {plan.agentLimit}
                    </span>
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-2 mb-6">
                    <span className="text-xs font-semibold text-slate-900 block mb-2">
                      Included in {plan.name}:
                    </span>
                    {plan.features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-start gap-2 text-xs text-slate-600"
                      >
                        <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
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
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer ${
                    isCurrent
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                      : plan.isPopular
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-98'
                        : 'bg-slate-950 hover:bg-black text-white active:scale-98'
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
      <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 shadow-xs">
        <div className="flex items-center gap-3">
          <CreditCard className="w-5 h-5 text-slate-400 shrink-0" />
          <span>
            Payments are securely processed through{' '}
            <strong className="text-slate-800">Paddle Sandbox</strong>. All major
            credit cards, PayPal, and Apple Pay are supported.
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            PCI-DSS Level 1 Certified
          </span>
          <span className="flex items-center gap-1 text-slate-600">
            <Zap className="w-4 h-4 text-blue-600" />
            Instant Provisioning
          </span>
        </div>
      </div>
    </div>
  );
}
