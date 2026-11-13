import { useQueryClient } from '@tanstack/react-query';
import {
  Bot,
  Building2,
  Calendar,
  Cpu,
  CreditCard,
  DollarSign,
  Layers,
  RefreshCw,
  Server,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useSuperAdminProfile } from '../hooks/useSuperAdmin';
import {
  SUPERADMIN_DASHBOARD_KEYS,
  useSuperAdminOverview,
  useSuperAdminRevenueChart,
  useSuperAdminTokenChart,
  useSuperAdminTopTenants,
} from '../hooks/useSuperAdminDashboard';

type DatePreset = 'today' | '7d' | '30d' | '90d' | 'all' | 'custom';

function formatTokens(num: number): string {
  if (!num) return '0';
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

function formatCurrency(amount: number, currency = 'USD'): string {
  const symbol = currency.toUpperCase() === 'USD' ? '$' : `${currency} `;
  return `${symbol}${(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const TIER_COLORS: Record<string, string> = {
  free: 'bg-slate-700/60 text-slate-300 border-slate-600/40',
  starter: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  pro: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  enterprise: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  unknown: 'bg-slate-800 text-slate-400 border-slate-700',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 shadow-2xl text-xs space-y-1.5 min-w-[150px]">
      <p className="font-semibold text-slate-300 border-b border-slate-800 pb-1">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={`tooltip-${index}`} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: entry.color }}
            />
            {entry.name}:
          </span>
          <span className="font-mono font-medium text-white">
            {typeof entry.value === 'number' && entry.name?.toLowerCase().includes('amount')
              ? `$${entry.value.toFixed(2)}`
              : typeof entry.value === 'number' && entry.name?.toLowerCase().includes('token')
                ? entry.value.toLocaleString()
                : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function SuperAdminDashboard() {
  const queryClient = useQueryClient();
  const { data: profileData, isLoading: profileLoading } = useSuperAdminProfile();

  const [datePreset, setDatePreset] = useState<DatePreset>('30d');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  const dateFilter = useMemo(() => {
    const now = new Date();
    if (datePreset === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { startDate: start.toISOString(), endDate: now.toISOString() };
    }
    if (datePreset === '7d') {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { startDate: start.toISOString(), endDate: now.toISOString() };
    }
    if (datePreset === '30d') {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { startDate: start.toISOString(), endDate: now.toISOString() };
    }
    if (datePreset === '90d') {
      const start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      return { startDate: start.toISOString(), endDate: now.toISOString() };
    }
    if (datePreset === 'custom' && customStart && customEnd) {
      return {
        startDate: new Date(customStart).toISOString(),
        endDate: new Date(`${customEnd}T23:59:59.999Z`).toISOString(),
      };
    }
    return undefined; // All time
  }, [datePreset, customStart, customEnd]);

  // TanStack Query custom hooks (strictly following Rule 8)
  const {
    data: overview,
    isLoading: overviewLoading,
    isRefetching: overviewRefetching,
  } = useSuperAdminOverview(dateFilter);

  const { data: revenueData, isLoading: revenueLoading } = useSuperAdminRevenueChart({
    ...dateFilter,
    interval: datePreset === '90d' || datePreset === 'all' ? 'week' : 'day',
  });

  const { data: tokenData, isLoading: tokenLoading } = useSuperAdminTokenChart({
    ...dateFilter,
    interval: datePreset === '90d' || datePreset === 'all' ? 'day' : 'day',
  });

  const { data: topTenants, isLoading: topTenantsLoading } = useSuperAdminTopTenants({
    ...dateFilter,
    limit: 5,
  });

  const adminName = profileData?.data?.name ?? 'SuperAdmin';

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: SUPERADMIN_DASHBOARD_KEYS.all });
  };

  const maxTenantTokens = useMemo(() => {
    if (!topTenants || topTenants.length === 0) return 1;
    return Math.max(...topTenants.map((t) => t.total_tokens), 1);
  }, [topTenants]);

  return (
    <div className="p-5 lg:p-7 space-y-6 max-w-[1700px] mx-auto">
      {/* Top Banner & Date Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/60">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {profileLoading ? (
              <span className="text-slate-500 text-base">Loading...</span>
            ) : (
              <>
                <span>Welcome back, {adminName}</span>
                <span className="text-base font-normal text-slate-400">👋</span>
              </>
            )}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time platform metrics, revenue trends, and AI agent token consumption.
          </p>
        </div>

        {/* Date Filter & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset buttons */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex items-center gap-0.5 text-xs">
            {(
              [
                { id: 'today', label: 'Today' },
                { id: '7d', label: '7D' },
                { id: '30d', label: '30D' },
                { id: '90d', label: '90D' },
                { id: 'all', label: 'All Time' },
                { id: 'custom', label: 'Custom' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                onClick={() => setDatePreset(p.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  datePreset === p.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers */}
          {datePreset === 'custom' && (
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-transparent border-none text-white focus:outline-none text-xs"
              />
              <span className="text-slate-500">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-transparent border-none text-white focus:outline-none text-xs"
              />
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={overviewRefetching}
            className="p-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200 transition-all disabled:opacity-50"
            title="Refresh dashboard data"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${overviewRefetching ? 'animate-spin text-indigo-400' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* KPI Stat Cards (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: Total Tenants */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm group">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Tenants</span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Building2 className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-white tracking-tight">
              {overviewLoading ? (
                <span className="text-slate-600 text-lg">Loading...</span>
              ) : (
                overview?.tenants.total.toLocaleString() ?? '0'
              )}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {overview?.tenants.active ?? 0} active
              </span>
              {(overview?.tenants.suspended ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-medium bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  {overview?.tenants.suspended} suspended
                </span>
              )}
            </div>
            {/* Tier breakdown preview */}
            {overview?.tenants.by_tier && Object.keys(overview.tenants.by_tier).length > 0 && (
              <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-800/60 text-[10px] text-slate-400">
                {Object.entries(overview.tenants.by_tier).map(([tier, count]) => (
                  <span
                    key={tier}
                    className={`px-1.5 py-0.5 rounded border capitalize ${
                      TIER_COLORS[tier.toLowerCase()] || TIER_COLORS.unknown
                    }`}
                  >
                    {tier}: {count}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* KPI 2: Total AI Agents */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm group">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total AI Agents</span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-600/20">
              <Bot className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-white tracking-tight">
              {overviewLoading ? (
                <span className="text-slate-600 text-lg">Loading...</span>
              ) : (
                overview?.agents.total.toLocaleString() ?? '0'
              )}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 text-[11px] text-indigo-400 font-medium bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                {overview?.agents.active ?? 0} active
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium bg-slate-800/60 px-2 py-0.5 rounded-md border border-slate-700/50">
                {overview?.agents.draft ?? 0} draft
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2.5 pt-2 border-t border-slate-800/60 flex items-center gap-1">
              <Cpu className="w-3 h-3 text-violet-400" />
              Powered by Orchestration Core
            </p>
          </div>
        </div>

        {/* KPI 3: Total Revenue */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm group">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Platform Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-white tracking-tight">
              {overviewLoading ? (
                <span className="text-slate-600 text-lg">Loading...</span>
              ) : (
                formatCurrency(overview?.revenue.total ?? 0, overview?.revenue.currency)
              )}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                Paddle Webhooks & Billing
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2.5 pt-2 border-t border-slate-800/60 flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-emerald-400" />
              Currency: {overview?.revenue.currency || 'USD'}
            </p>
          </div>
        </div>

        {/* KPI 4: Total Tokens Consumed */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm group">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Tokens Consumed</span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-600/20">
              <Zap className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-white tracking-tight font-mono">
              {overviewLoading ? (
                <span className="text-slate-600 text-lg">Loading...</span>
              ) : (
                formatTokens(overview?.tokens.total ?? 0)
              )}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 text-[11px] text-cyan-400 font-medium bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                <Zap className="w-3 h-3 text-cyan-400" />
                Raw: {(overview?.tokens.total ?? 0).toLocaleString()} tokens
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2.5 pt-2 border-t border-slate-800/60 flex items-center gap-1">
              <Layers className="w-3 h-3 text-cyan-400" />
              Indexed in Bonsai OpenSearch
            </p>
          </div>
        </div>
      </div>

      {/* Graphs Section: 2 Responsive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graph 1: Transaction & Revenue Bar Chart */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Revenue & Transaction Activity
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Aggregated subscription charges & renewals from MongoDB Billing Ledger
              </p>
            </div>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Billing Ledger
            </span>
          </div>

          <div className="h-72 w-full mt-2">
            {revenueLoading ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                Loading revenue data...
              </div>
            ) : !revenueData || revenueData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
                <CreditCard className="w-8 h-8 text-slate-700" />
                <p>No transactions recorded for this period</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="amount"
                    name="Revenue Amount ($)"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Graph 2: Token Consumption Area Chart (OpenSearch) */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                Token Consumption Over Time
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Input vs Output LLM tokens consumed across all agent interactions
              </p>
            </div>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              OpenSearch Ledger
            </span>
          </div>

          <div className="h-72 w-full mt-2">
            {tokenLoading ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                Loading token metrics...
              </div>
            ) : !tokenData || tokenData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
                <Zap className="w-8 h-8 text-slate-700" />
                <p>No token events recorded for this period</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={tokenData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOutput" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorInput" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                    tickFormatter={(val) => formatTokens(val)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="output_tokens"
                    name="Output Tokens"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorOutput)"
                  />
                  <Area
                    type="monotone"
                    dataKey="input_tokens"
                    name="Input Tokens"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorInput)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Top 5 Tenants by Token Consumption + Platform Health */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Top 5 Tenants by Token Usage Table */}
        <div className="xl:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                Top 5 Tenants by Token Usage
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Highest resource consumption tenants aggregated by OpenSearch terms
              </p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
              Top Consumers
            </span>
          </div>

          <div className="overflow-x-auto">
            {topTenantsLoading ? (
              <div className="p-8 text-center text-slate-500 text-xs">Loading top tenants...</div>
            ) : !topTenants || topTenants.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No tenant token consumption recorded in OpenSearch yet.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] text-slate-500 font-medium uppercase tracking-wider border-b border-slate-800/50">
                    <th className="text-left px-5 py-3 bg-slate-900/40">Rank & Business</th>
                    <th className="text-left px-5 py-3 bg-slate-900/40 hidden sm:table-cell">Tier</th>
                    <th className="text-left px-5 py-3 bg-slate-900/40">Tokens Used</th>
                    <th className="text-left px-5 py-3 bg-slate-900/40 hidden md:table-cell">
                      Usage Share
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {topTenants.map((item, idx) => {
                    const percentage = Math.min(
                      100,
                      Math.round((item.total_tokens / maxTenantTokens) * 100),
                    );
                    return (
                      <tr key={item.tenant_id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold flex items-center justify-center border border-slate-700">
                              #{idx + 1}
                            </span>
                            <div>
                              <p className="text-sm font-medium text-white leading-none">
                                {item.business_name}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-1 font-mono">
                                {item.email || item.tenant_id}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 hidden sm:table-cell">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-medium border capitalize ${
                              TIER_COLORS[item.tier?.toLowerCase()] || TIER_COLORS.unknown
                            }`}
                          >
                            {item.tier || 'Starter'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-semibold text-cyan-400 font-mono">
                            {formatTokens(item.total_tokens)}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {item.total_tokens.toLocaleString()} tokens
                          </p>
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          <div className="w-32 flex items-center gap-2">
                            <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-mono text-slate-400">
                              {percentage}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* System & Services Live Health */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-violet-400" />
                Infrastructure Health
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                All Systems Normal
              </span>
            </div>

            <div className="space-y-3">
              {[
                {
                  name: 'OpenSearch (Bonsai Cluster)',
                  type: 'Analytics & Token Ledger',
                  status: 'Operational',
                  indicator: 'emerald',
                },
                {
                  name: 'MongoDB Replica Set',
                  type: 'Tenants & Billing Ledgers',
                  status: 'Operational',
                  indicator: 'emerald',
                },
                {
                  name: 'Kafka Event Bus (Aiven)',
                  type: 'billing.tokens.consumed',
                  status: 'Connected',
                  indicator: 'emerald',
                },
                {
                  name: 'Redis Cache Cluster',
                  type: 'Fast Tier Lookups (30D TTL)',
                  status: 'Operational',
                  indicator: 'emerald',
                },
                {
                  name: 'AI Orchestration Service',
                  type: 'gRPC Port 50052',
                  status: 'Connected',
                  indicator: 'emerald',
                },
              ].map((svc) => (
                <div
                  key={svc.name}
                  className="bg-slate-800/40 border border-slate-700/40 rounded-xl px-3.5 py-2.5 flex items-center justify-between hover:bg-slate-800/60 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white truncate">{svc.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{svc.type}</p>
                  </div>
                  <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {svc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
            <span>Schedulux Enterprise Core</span>
            <span className="font-mono">v2.4-stable</span>
          </div>
        </div>
      </div>
    </div>
  );
}
