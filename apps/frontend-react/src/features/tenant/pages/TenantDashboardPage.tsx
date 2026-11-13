import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  BookOpen,
  Bot,
  Calendar,
  Clock,
  Code2,
  Package,
  Plus,
  RefreshCw,
  Settings2,
  Tag,
  Zap,
} from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { useAuthStore } from '../../../store/useAuthStore';
import {
  TENANT_DASHBOARD_KEYS,
  useTenantDashboardOverview,
} from '../hooks/useTenantDashboard';

function formatTokens(num: number): string {
  if (!num) return '0';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

const STATUS_PILL: Record<string, string> = {
  CONFIRMED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  PENDING: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  CANCELLED: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  COMPLETED: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  confirmed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  cancelled: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  completed: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  created: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  live: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
};

export default function TenantDashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const authUser = useAuthStore((state) => state.user);

  const { agentId: routeAgentId } = useParams<{ agentId?: string }>();
  const [searchParams] = useSearchParams();
  const queryAgentId = searchParams.get('agent_id');
  const targetAgentId = routeAgentId || queryAgentId || undefined;

  const { data, isLoading, isRefetching } = useTenantDashboardOverview(targetAgentId);

  const activeAgent = data?.agent;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: TENANT_DASHBOARD_KEYS.all });
  };

  const tokenPercentage = useMemo(() => {
    if (!data?.tokens?.weekly_limit || data.tokens.weekly_limit <= 0) return 0;
    const pct = Math.round((data.tokens.used_this_week / data.tokens.weekly_limit) * 100);
    return Math.min(100, Math.max(0, pct));
  }, [data]);

  return (
    <div className="p-5 lg:p-7 space-y-6 max-w-[1700px] mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/40 p-4.5 rounded-2xl border border-slate-800/60 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {authUser?.business_name || 'My Workspace'}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-semibold uppercase tracking-wider">
                {data?.tier.name || authUser?.tier || 'Starter'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Agent-isolated operations cockpit: services, inventory capacity, and customer bookings.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/tenant/landingboard')}
            className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Agent</span>
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefetching}
            className="p-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200 transition-all disabled:opacity-50"
            title="Refresh dashboard"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin text-indigo-400' : ''}`}
            />
          </button>
        </div>
      </div>

      {!isLoading && !activeAgent && (
        <div className="rounded-2xl border border-dashed border-indigo-500/40 bg-indigo-950/20 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
            <Bot className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No AI Agent Configured</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Get started by creating your first autonomous receptionist to handle bookings, customer inquiries, and staff scheduling.
          </p>
          <button
            onClick={() => navigate('/tenant/landingboard')}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            Create AI Agent
          </button>
        </div>
      )}

      {activeAgent && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Active Agent</span>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-bold text-white tracking-tight truncate">
                  {isLoading ? '...' : activeAgent.name}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border ${
                      STATUS_PILL[activeAgent.status] || 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        activeAgent.status === 'created' ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                    />
                    {activeAgent.status === 'created' ? 'Live' : 'Draft'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono truncate">
                    {activeAgent.creation_source || 'custom'}
                  </span>
                </div>
              </div>
            </div>

            <div
              onClick={() => navigate(`/tenant/agents/${activeAgent.agent_id}/services`)}
              className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Agent Services</span>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-600/20">
                  <Tag className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-white tracking-tight">
                  {isLoading ? '...' : data?.inventory.total_services ?? 0}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Assigned to this agent
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </div>

            <div
              onClick={() => navigate(`/tenant/agents/${activeAgent.agent_id}/resources`)}
              className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Resources & Capacity</span>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-600/20">
                  <Package className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-white tracking-tight">
                  {isLoading ? '...' : data?.inventory.total_resources ?? 0}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Staff, rooms & equipment
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </div>

            <div
              onClick={() => navigate('/tenant/bookings')}
              className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Agent Appointments</span>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-600/20">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-white tracking-tight">
                  {isLoading ? '...' : data?.bookings.total ?? 0}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    {data?.bookings.confirmed ?? 0} Confirmed
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    {data?.bookings.pending ?? 0} Other
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Weekly AI Token Quota</p>
                  <p className="text-base font-bold text-white font-mono mt-0.5">
                    {isLoading ? '...' : formatTokens(data?.tokens.used_this_week ?? 0)}
                    <span className="text-xs text-slate-400 font-normal">
                      {' '}/ {formatTokens(data?.tokens.weekly_limit ?? 0)}
                    </span>
                  </p>
                </div>
              </div>
              <div className="w-32 hidden sm:block">
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${tokenPercentage}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 text-right mt-1 font-mono">
                  {tokenPercentage}% used
                </p>
              </div>
            </div>

            <div
              onClick={() => navigate(`/tenant/agents/${activeAgent.agent_id}/knowledge`)}
              className="bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-4.5 flex items-center justify-between cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Trained Knowledge Base</p>
                  <p className="text-base font-bold text-white mt-0.5">
                    {isLoading ? '...' : data?.knowledge.total_documents ?? 0}{' '}
                    <span className="text-xs text-slate-400 font-normal">Documents / FAQs</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
                <span>Manage</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: 'Configure Agent',
                path: `/tenant/agent-setup/${activeAgent.agent_id}`,
                icon: Settings2,
              },
              {
                label: 'Agent Services',
                path: `/tenant/agents/${activeAgent.agent_id}/services`,
                icon: Tag,
              },
              {
                label: 'Agent Resources',
                path: `/tenant/agents/${activeAgent.agent_id}/resources`,
                icon: Package,
              },
              {
                label: 'Embed Chat Widget',
                path: '/tenant/widget',
                icon: Code2,
              },
            ].map((action) => (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40 text-left transition-all group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <action.icon className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span className="text-xs font-semibold text-slate-300 group-hover:text-white truncate">
                    {action.label}
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-7 bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-cyan-400" />
                    Recent Appointments for {activeAgent.name}
                  </h3>
                  <button
                    onClick={() => navigate('/tenant/bookings')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors flex items-center gap-1"
                  >
                    View calendar <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  {isLoading ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      Loading appointments...
                    </div>
                  ) : !data?.bookings.recent || data.bookings.recent.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      No appointments scheduled for this agent yet.
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-[11px] text-slate-500 font-medium uppercase tracking-wider border-b border-slate-800/50">
                          <th className="text-left px-5 py-3 bg-slate-900/40">Customer</th>
                          <th className="text-left px-5 py-3 bg-slate-900/40 hidden sm:table-cell">
                            Date & Time
                          </th>
                          <th className="text-left px-5 py-3 bg-slate-900/40">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {data.bookings.recent.map((booking) => (
                          <tr
                            key={booking.booking_id}
                            className="hover:bg-slate-800/30 transition-colors"
                          >
                            <td className="px-5 py-3.5">
                              <p className="text-sm font-medium text-white leading-none">
                                {booking.customer_name}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-1 font-mono">
                                {booking.customer_phone || booking.booking_reference}
                              </p>
                            </td>
                            <td className="px-5 py-3.5 hidden sm:table-cell text-xs text-slate-400">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-slate-500" />
                                <span>
                                  {booking.start_time
                                    ? new Date(booking.start_time).toLocaleString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })
                                    : 'TBD'}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium border uppercase tracking-wider ${
                                  STATUS_PILL[booking.status] || 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {booking.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            <div className="xl:col-span-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-400" />
                    Agent Services & Offerings
                  </h3>
                  <button
                    onClick={() => navigate(`/tenant/agents/${activeAgent.agent_id}/services`)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors flex items-center gap-1"
                  >
                    All services <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="p-4 space-y-2.5">
                  {isLoading ? (
                    <div className="p-6 text-center text-slate-500 text-xs">
                      Loading services...
                    </div>
                  ) : !data?.inventory.recent_services || data.inventory.recent_services.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-xs">
                      No bookable services assigned to this agent yet.
                    </div>
                  ) : (
                    data.inventory.recent_services.map((svc) => (
                      <div
                        key={svc.service_id}
                        className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/70 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{svc.name}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>{svc.category}</span>
                            <span>•</span>
                            <span>{svc.duration_minutes} min</span>
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-emerald-400 font-mono">
                            {svc.price
                              ? `${svc.price.currency} ${svc.price.amount}`
                              : 'Free'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-slate-800/60 bg-slate-900/40 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">
                  {data?.inventory.total_services ?? 0} active services
                </span>
                <button
                  onClick={() => navigate(`/tenant/agents/${activeAgent.agent_id}/services`)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/20 flex items-center gap-1 transition"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Service</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
