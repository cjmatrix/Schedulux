import {
  AlertTriangle,
  Bot,
  Briefcase,
  CheckCircle2,
  Database,
  Edit2,
  FileText,
  Gauge,
  Globe,
  HardDrive,
  Info,
  Layers,
  Loader2,
  RefreshCw,
  Sliders,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { type TierConfigData, type UpdateTierConfigPayload } from '../api/tierConfigApi';
import { useTierConfigs, useUpdateTierConfig } from '../hooks/useTierConfigs';

const TIER_STYLES: Record<string, { badge: string; border: string; accent: string; glow: string }> =
  {
    starter: {
      badge: 'bg-slate-800 text-slate-300 border-slate-700',
      border: 'border-slate-800',
      accent: 'text-slate-400',
      glow: 'from-slate-500/10 to-transparent',
    },
    pro: {
      badge: 'bg-indigo-900/40 text-indigo-300 border-indigo-500/30',
      border: 'border-indigo-500/20',
      accent: 'text-indigo-400',
      glow: 'from-indigo-500/10 to-transparent',
    },
    business: {
      badge: 'bg-sky-900/40 text-sky-300 border-sky-500/30',
      border: 'border-sky-500/20',
      accent: 'text-sky-400',
      glow: 'from-sky-500/10 to-transparent',
    },
    enterprise: {
      badge: 'bg-amber-900/30 text-amber-300 border-amber-500/30',
      border: 'border-amber-500/20',
      accent: 'text-amber-400',
      glow: 'from-amber-500/10 to-transparent',
    },
  };

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string }> = {
  active: {
    label: 'Active',
    dot: 'bg-emerald-500',
    text: 'text-emerald-400',
  },
  deprecated: {
    label: 'Deprecated',
    dot: 'bg-amber-500',
    text: 'text-amber-400',
  },
  inactive: {
    label: 'Inactive',
    dot: 'bg-rose-500',
    text: 'text-rose-400',
  },
};

function formatLimit(val: number, unit = ''): string {
  if (val === -1) return 'Unlimited';
  return `${val.toLocaleString()} ${unit}`.trim();
}

interface FormState {
  name: string;
  rate_limit_rpm: number | '';
  max_agents: number | '';
  max_services: number | '';
  max_resources: number | '';
  max_kb_docs: number | '';
  max_kb_doc_size_mb: number | '';
  weekly_token_limit: number | '';
  weekly_crawl_limit: number | '';
  status: 'active' | 'deprecated' | 'inactive';
  description: string;
}

const INITIAL_FORM_STATE: FormState = {
  name: '',
  rate_limit_rpm: 60,
  max_agents: 1,
  max_services: 5,
  max_resources: 3,
  max_kb_docs: 3,
  max_kb_doc_size_mb: 5,
  weekly_token_limit: 100000,
  weekly_crawl_limit: 5,
  status: 'active',
  description: '',
};

export default function RateLimitsPage() {
  const { data: tierConfigs = [], isLoading, isError, refetch } = useTierConfigs();
  const updateMutation = useUpdateTierConfig();

  const [editingTier, setEditingTier] = useState<TierConfigData | null>(null);
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM_STATE);

  const handleOpenEdit = (tier: TierConfigData) => {
    setEditingTier(tier);
    setFormData({
      name: tier.name,
      rate_limit_rpm: tier.rate_limit_rpm,
      max_agents: tier.max_agents,
      max_services: tier.max_services,
      max_resources: tier.max_resources,
      max_kb_docs: tier.max_kb_docs,
      max_kb_doc_size_mb: tier.max_kb_doc_size_mb,
      weekly_token_limit: tier.weekly_token_limit,
      weekly_crawl_limit: tier.weekly_crawl_limit ?? (tier.tier === 'enterprise' ? -1 : 5),
      status: tier.status,
      description: tier.description || '',
    });
  };

  const handleCloseEdit = () => {
    setEditingTier(null);
    setFormData(INITIAL_FORM_STATE);
  };

  const handleNumberChange = (field: keyof FormState, val: string) => {
    if (val === '') {
      setFormData((prev) => ({ ...prev, [field]: '' }));
      return;
    }
    const parsed = parseInt(val, 10);
    setFormData((prev) => ({
      ...prev,
      [field]: Number.isNaN(parsed) ? '' : parsed,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTier) return;

    const payload: UpdateTierConfigPayload = {
      name: formData.name.trim(),
      status: formData.status,
      description: formData.description.trim(),
      rate_limit_rpm: formData.rate_limit_rpm === '' ? 60 : Number(formData.rate_limit_rpm),
      max_agents: formData.max_agents === '' ? -1 : Number(formData.max_agents),
      max_services: formData.max_services === '' ? -1 : Number(formData.max_services),
      max_resources: formData.max_resources === '' ? -1 : Number(formData.max_resources),
      max_kb_docs: formData.max_kb_docs === '' ? -1 : Number(formData.max_kb_docs),
      max_kb_doc_size_mb:
        formData.max_kb_doc_size_mb === '' ? 5 : Number(formData.max_kb_doc_size_mb),
      weekly_token_limit:
        formData.weekly_token_limit === '' ? -1 : Number(formData.weekly_token_limit),
      weekly_crawl_limit:
        formData.weekly_crawl_limit === '' ? -1 : Number(formData.weekly_crawl_limit),
    };

    try {
      await updateMutation.mutateAsync({
        tier: editingTier.tier,
        payload,
      });
      toast.success(
        `Tier "${editingTier.name}" updated successfully. Changes synchronized with Redis cache.`,
      );
      handleCloseEdit();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update tier configuration';
      toast.error(msg);
    }
  };

  const totalTiers = tierConfigs.length;
  const activeTiers = tierConfigs.filter((t) => t.status === 'active').length;
  const maxPeakRpm = Math.max(0, ...tierConfigs.map((t) => t.rate_limit_rpm));

  return (
    <div className="flex flex-col min-h-full bg-[#111111] font-sans text-slate-300 p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-semibold text-white tracking-tight">
              Rate Limits & Tier Configuration
            </h1>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-950/50 text-emerald-400 border border-emerald-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Redis Cache Synchronized
            </div>
          </div>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            Configure dynamic API rate limits (requests per minute) and resource quota ceilings for
            each subscription tier. Changes persist to MongoDB and propagate immediately across
            runtime clusters via the distributed Redis cache.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] border border-slate-700 rounded text-[11px] font-medium text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Sync Cache
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#18181b] border border-slate-800/80 rounded-lg p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-medium text-slate-400 tracking-wider uppercase">
              Total Tiers
            </span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-3xl font-light text-white">{totalTiers}</span>
        </div>

        <div className="bg-[#18181b] border border-slate-800/80 rounded-lg p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-medium text-slate-400 tracking-wider uppercase">
              Active Tiers
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-3xl font-light text-emerald-400">{activeTiers}</span>
        </div>

        <div className="bg-[#18181b] border border-slate-800/80 rounded-lg p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-medium text-slate-400 tracking-wider uppercase">
              Peak Rate Limit
            </span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-light text-amber-400">
              {maxPeakRpm.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-mono">RPM</span>
          </div>
        </div>

        <div className="bg-[#18181b] border border-slate-800/80 rounded-lg p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-medium text-slate-400 tracking-wider uppercase">
              Default Tier
            </span>
            <Briefcase className="w-4 h-4 text-sky-400" />
          </div>
          <span className="text-xl font-medium text-white">Starter</span>
        </div>
      </div>

      {/* Tiers List Section */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          <p className="text-sm">Loading tier configurations from database and cache...</p>
        </div>
      ) : isError ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-rose-400">
          <AlertTriangle className="w-6 h-6" />
          <p className="text-sm">Failed to load tier configurations.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {tierConfigs.map((config) => {
            const style = TIER_STYLES[config.tier.toLowerCase()] ?? TIER_STYLES.starter;
            const status = STATUS_CONFIG[config.status] ?? STATUS_CONFIG.active;

            return (
              <div
                key={config.tier}
                className={`bg-[#18181b] border ${style.border} rounded-xl p-6 relative overflow-hidden flex flex-col justify-between transition-all hover:border-slate-700`}
              >
                {/* Background ambient gradient */}
                <div
                  className={`absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl ${style.glow} pointer-events-none rounded-full blur-3xl`}
                />

                {/* Top header */}
                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span
                          className={`px-2.5 py-0.5 rounded text-xs font-medium border uppercase tracking-wider ${style.badge}`}
                        >
                          {config.tier}
                        </span>
                        <span className="text-lg font-semibold text-white tracking-tight">
                          {config.name}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {config.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#131313] border border-slate-800 text-[11px]">
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        <span className={status.text}>{status.label}</span>
                      </div>

                      <button
                        onClick={() => handleOpenEdit(config)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-[#222226] hover:bg-slate-700 text-slate-200 border border-slate-700/80 rounded text-xs font-medium transition-colors"
                      >
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                    </div>
                  </div>

                  {/* Primary Rate Limit Banner */}
                  <div className="my-5 p-4 rounded-lg bg-[#141416] border border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-950/40 border border-indigo-700/30 flex items-center justify-center text-indigo-400">
                        <Gauge className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
                          Sliding Window Rate Limit
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-semibold text-white font-mono">
                            {config.rate_limit_rpm.toLocaleString()}
                          </span>
                          <span className="text-xs text-slate-400">req / minute</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 justify-end">
                        <Zap className="w-3 h-3" /> Redis Enforced
                      </span>
                    </div>
                  </div>

                  {/* Resource Quotas Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mb-2">
                    <div className="p-3 bg-[#141416]/60 rounded-lg border border-slate-800/60">
                      <span className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                        <Bot className="w-3.5 h-3.5 text-indigo-400" /> Max AI Agents
                      </span>
                      <span className="text-sm font-semibold text-slate-200 font-mono">
                        {formatLimit(config.max_agents)}
                      </span>
                    </div>

                    <div className="p-3 bg-[#141416]/60 rounded-lg border border-slate-800/60">
                      <span className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                        <Briefcase className="w-3.5 h-3.5 text-sky-400" /> Max Services
                      </span>
                      <span className="text-sm font-semibold text-slate-200 font-mono">
                        {formatLimit(config.max_services)}
                      </span>
                    </div>

                    <div className="p-3 bg-[#141416]/60 rounded-lg border border-slate-800/60">
                      <span className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                        <Database className="w-3.5 h-3.5 text-emerald-400" /> Max Resources
                      </span>
                      <span className="text-sm font-semibold text-slate-200 font-mono">
                        {formatLimit(config.max_resources)}
                      </span>
                    </div>

                    <div className="p-3 bg-[#141416]/60 rounded-lg border border-slate-800/60">
                      <span className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                        <FileText className="w-3.5 h-3.5 text-violet-400" /> Max KB Docs
                      </span>
                      <span className="text-sm font-semibold text-slate-200 font-mono">
                        {formatLimit(config.max_kb_docs)}
                      </span>
                    </div>

                    <div className="p-3 bg-[#141416]/60 rounded-lg border border-slate-800/60">
                      <span className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                        <HardDrive className="w-3.5 h-3.5 text-amber-400" /> Max Doc Size
                      </span>
                      <span className="text-sm font-semibold text-slate-200 font-mono">
                        {formatLimit(config.max_kb_doc_size_mb, 'MB')}
                      </span>
                    </div>

                    <div className="p-3 bg-[#141416]/60 rounded-lg border border-slate-800/60">
                      <span className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-rose-400" /> Weekly Tokens
                      </span>
                      <span className="text-sm font-semibold text-slate-200 font-mono">
                        {formatLimit(config.weekly_token_limit)}
                      </span>
                    </div>

                    <div className="p-3 bg-[#141416]/60 rounded-lg border border-slate-800/60">
                      <span className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1">
                        <Globe className="w-3.5 h-3.5 text-blue-400" /> Weekly Crawls
                      </span>
                      <span className="text-sm font-semibold text-slate-200 font-mono">
                        {formatLimit(
                          config.weekly_crawl_limit ?? (config.tier === 'enterprise' ? -1 : 5),
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer timestamp */}
                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>ID: {config.id}</span>
                  {config.updated_at && (
                    <span>Updated: {new Date(config.updated_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Tier Modal */}
      {editingTier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#18181b] border border-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-[#18181b] z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">
                    Edit Tier Configuration: {editingTier.name}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono uppercase">
                    Tier ID: {editingTier.tier}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseEdit}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-6">
              {/* Status and Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-[#141416] border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Status</label>
                  <select
                    value={formData.status || 'active'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as 'active' | 'deprecated' | 'inactive',
                      })
                    }
                    className="w-full px-3 py-2 bg-[#141416] border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="active">Active (Available for purchase)</option>
                    <option value="deprecated">Deprecated (Grandfathered only)</option>
                    <option value="inactive">Inactive (Disabled)</option>
                  </select>
                </div>
              </div>

              {/* Rate Limit RPM Emphasis */}
              <div className="p-4 bg-indigo-950/20 border border-indigo-500/30 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
                    <Zap className="w-4 h-4 text-indigo-400" /> Rate Limit (Requests Per Minute)
                  </label>
                  <span className="text-[11px] font-mono text-indigo-400">
                    {formData.rate_limit_rpm === '' ? 0 : formData.rate_limit_rpm} RPM
                  </span>
                </div>
                <input
                  type="number"
                  min={1}
                  max={100000}
                  value={formData.rate_limit_rpm}
                  onChange={(e) => handleNumberChange('rate_limit_rpm', e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#141416] border border-slate-700 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-400 leading-normal flex items-start gap-1">
                  <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                  Tenant traffic exceeding this ceiling in a 60-second window receives HTTP 429 (Too
                  Many Requests). Changes propagate directly to Redis sliding window evaluators.
                </p>
              </div>

              {/* Quotas Grid */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Resource Ceilings & Limits
                  </h4>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Enter -1 for Unlimited
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-slate-300">
                        Max AI Agents
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            max_agents: prev.max_agents === -1 ? 1 : -1,
                          }))
                        }
                        className={`text-[10px] px-1.5 py-0.5 rounded transition ${
                          formData.max_agents === -1
                            ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {formData.max_agents === -1 ? 'Unlimited' : 'Set Unlimited (-1)'}
                      </button>
                    </div>
                    <input
                      type="number"
                      value={formData.max_agents}
                      onChange={(e) => handleNumberChange('max_agents', e.target.value)}
                      className="w-full px-3 py-2 bg-[#141416] border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-slate-300">
                        Max Services
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            max_services: prev.max_services === -1 ? 5 : -1,
                          }))
                        }
                        className={`text-[10px] px-1.5 py-0.5 rounded transition ${
                          formData.max_services === -1
                            ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {formData.max_services === -1 ? 'Unlimited' : 'Set Unlimited (-1)'}
                      </button>
                    </div>
                    <input
                      type="number"
                      value={formData.max_services}
                      onChange={(e) => handleNumberChange('max_services', e.target.value)}
                      className="w-full px-3 py-2 bg-[#141416] border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-slate-300">
                        Max Resources
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            max_resources: prev.max_resources === -1 ? 3 : -1,
                          }))
                        }
                        className={`text-[10px] px-1.5 py-0.5 rounded transition ${
                          formData.max_resources === -1
                            ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {formData.max_resources === -1 ? 'Unlimited' : 'Set Unlimited (-1)'}
                      </button>
                    </div>
                    <input
                      type="number"
                      value={formData.max_resources}
                      onChange={(e) => handleNumberChange('max_resources', e.target.value)}
                      className="w-full px-3 py-2 bg-[#141416] border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-slate-300">
                        Max Knowledge Base Documents
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            max_kb_docs: prev.max_kb_docs === -1 ? 3 : -1,
                          }))
                        }
                        className={`text-[10px] px-1.5 py-0.5 rounded transition ${
                          formData.max_kb_docs === -1
                            ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {formData.max_kb_docs === -1 ? 'Unlimited' : 'Set Unlimited (-1)'}
                      </button>
                    </div>
                    <input
                      type="number"
                      value={formData.max_kb_docs}
                      onChange={(e) => handleNumberChange('max_kb_docs', e.target.value)}
                      className="w-full px-3 py-2 bg-[#141416] border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Max Document Upload Size (MB)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formData.max_kb_doc_size_mb}
                      onChange={(e) => handleNumberChange('max_kb_doc_size_mb', e.target.value)}
                      className="w-full px-3 py-2 bg-[#141416] border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-slate-300">
                        Weekly AI Token Limit
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            weekly_token_limit: prev.weekly_token_limit === -1 ? 100000 : -1,
                          }))
                        }
                        className={`text-[10px] px-1.5 py-0.5 rounded transition ${
                          formData.weekly_token_limit === -1
                            ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {formData.weekly_token_limit === -1 ? 'Unlimited' : 'Set Unlimited (-1)'}
                      </button>
                    </div>
                    <input
                      type="number"
                      value={formData.weekly_token_limit}
                      onChange={(e) => handleNumberChange('weekly_token_limit', e.target.value)}
                      className="w-full px-3 py-2 bg-[#141416] border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-slate-300">
                        Weekly Web Crawl Quota
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            weekly_crawl_limit: prev.weekly_crawl_limit === -1 ? 5 : -1,
                          }))
                        }
                        className={`text-[10px] px-1.5 py-0.5 rounded transition ${
                          formData.weekly_crawl_limit === -1
                            ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {formData.weekly_crawl_limit === -1 ? 'Unlimited' : 'Set Unlimited (-1)'}
                      </button>
                    </div>
                    <input
                      type="number"
                      value={formData.weekly_crawl_limit}
                      onChange={(e) => handleNumberChange('weekly_crawl_limit', e.target.value)}
                      className="w-full px-3 py-2 bg-[#141416] border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Tier Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Short description of who this plan is intended for..."
                  className="w-full px-3 py-2 bg-[#141416] border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-[#141416] hover:bg-slate-800 border border-slate-700 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {updateMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save & Sync Cache
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
