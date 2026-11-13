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
  CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200/80',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200/80',
  COMPLETED: 'bg-blue-50 text-blue-700 border-blue-200/80',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  pending: 'bg-amber-50 text-amber-700 border-amber-200/80',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200/80',
  completed: 'bg-blue-50 text-blue-700 border-blue-200/80',
  created: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  live: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
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
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Bot className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {authUser?.business_name || 'My Workspace'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 text-xs font-semibold uppercase tracking-wider">
              {data?.tier.name || authUser?.tier || 'Starter'}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Agent-isolated operations cockpit: services, inventory capacity, and customer bookings.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/tenant/landingboard')}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Agent</span>
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefetching}
            className="p-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-slate-600 hover:text-slate-900 transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
            title="Refresh dashboard"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin text-indigo-600' : ''}`}
            />
          </button>
        </div>
      </div>

      {!isLoading && !activeAgent && (
        <div className="rounded-2xl border border-dashed border-indigo-300 bg-indigo-50/50 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 border border-indigo-200 flex items-center justify-center mx-auto text-indigo-600">
            <Bot className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No AI Agent Configured</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Get started by creating your first autonomous receptionist to handle bookings, customer inquiries, and staff scheduling.
          </p>
          <button
            onClick={() => navigate('/tenant/landingboard')}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Create AI Agent
          </button>
        </div>
      )}

      {activeAgent && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-300 transition-all shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold">Active Agent</span>
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
                  <Bot className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight truncate">
                  {isLoading ? '...' : activeAgent.name}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                      STATUS_PILL[activeAgent.status] || 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        activeAgent.status === 'created' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                    {activeAgent.status === 'created' ? 'Live' : 'Draft'}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono truncate">
                    {activeAgent.creation_source || 'custom'}
                  </span>
                </div>
              </div>
            </div>

            <div
              onClick={() => navigate(`/tenant/agents/${activeAgent.agent_id}/services`)}
              className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-300 hover:shadow-sm transition-all shadow-xs cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold">Agent Services</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs">
                  <Tag className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-slate-900 tracking-tight">
                  {isLoading ? '...' : data?.inventory.total_services ?? 0}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Assigned to this agent
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </div>

            <div
              onClick={() => navigate(`/tenant/agents/${activeAgent.agent_id}/resources`)}
              className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-300 hover:shadow-sm transition-all shadow-xs cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold">Resources &amp; Capacity</span>
                <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shadow-2xs">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-slate-900 tracking-tight">
                  {isLoading ? '...' : data?.inventory.total_resources ?? 0}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Staff, rooms &amp; equipment
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </div>

            <div
              onClick={() => navigate('/tenant/bookings')}
              className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-300 hover:shadow-sm transition-all shadow-xs cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold">Agent Appointments</span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-slate-900 tracking-tight">
                  {isLoading ? '...' : data?.bookings.total ?? 0}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {data?.bookings.confirmed ?? 0} Confirmed
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    {data?.bookings.pending ?? 0} Other
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold">Weekly AI Token Quota</p>
                  <p className="text-base font-bold text-slate-900 font-mono mt-0.5">
                    {isLoading ? '...' : formatTokens(data?.tokens.used_this_week ?? 0)}
                    <span className="text-xs text-slate-400 font-normal">
                      {' '}/ {formatTokens(data?.tokens.weekly_limit ?? 0)}
                    </span>
                  </p>
                </div>
              </div>
              <div className="w-32 hidden sm:block">
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${tokenPercentage}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 text-right mt-1 font-mono font-medium">
                  {tokenPercentage}% used
                </p>
              </div>
            </div>

            <div
              onClick={() => navigate(`/tenant/agents/${activeAgent.agent_id}/knowledge`)}
              className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-4.5 flex items-center justify-between cursor-pointer transition-all group shadow-xs hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-indigo-600 shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold">Trained Knowledge Base</p>
                  <p className="text-base font-bold text-slate-900 mt-0.5">
                    {isLoading ? '...' : data?.knowledge.total_documents ?? 0}{' '}
                    <span className="text-xs text-slate-400 font-normal">Documents / FAQs</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-indigo-600 group-hover:text-indigo-700">
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
                className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/80 text-left transition-all group shadow-2xs cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <action.icon className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 truncate">
                    {action.label}
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-7 bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    Recent Appointments for {activeAgent.name}
                  </h3>
                  <button
                    onClick={() => navigate('/tenant/bookings')}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    View calendar <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  {isLoading ? (
                    <div className="p-8 text-center text-slate-400 text-xs font-medium">
                      Loading appointments...
                    </div>
                  ) : !data?.bookings.recent || data.bookings.recent.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs font-medium">
                      No appointments scheduled for this agent yet.
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100 bg-slate-50/60">
                          <th className="text-left px-5 py-3">Customer</th>
                          <th className="text-left px-5 py-3 hidden sm:table-cell">
                            Date &amp; Time
                          </th>
                          <th className="text-left px-5 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.bookings.recent.map((booking) => (
                          <tr
                            key={booking.booking_id}
                            className="hover:bg-slate-50/70 transition-colors"
                          >
                            <td className="px-5 py-3.5">
                              <p className="text-sm font-semibold text-slate-900 leading-none">
                                {booking.customer_name}
                              </p>
                              <p className="text-[11px] text-slate-400 mt-1 font-mono">
                                {booking.customer_phone || booking.booking_reference}
                              </p>
                            </td>
                            <td className="px-5 py-3.5 hidden sm:table-cell text-xs text-slate-600 font-medium">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
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
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border uppercase tracking-wider ${
                                  STATUS_PILL[booking.status] || 'bg-slate-100 text-slate-600 border-slate-200'
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

            <div className="xl:col-span-5 bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-600" />
                    Agent Services &amp; Offerings
                  </h3>
                  <button
                    onClick={() => navigate(`/tenant/agents/${activeAgent.agent_id}/services`)}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    All services <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="p-4 space-y-2.5">
                  {isLoading ? (
                    <div className="p-6 text-center text-slate-400 text-xs font-medium">
                      Loading services...
                    </div>
                  ) : !data?.inventory.recent_services || data.inventory.recent_services.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs font-medium">
                      No bookable services assigned to this agent yet.
                    </div>
                  ) : (
                    data.inventory.recent_services.map((svc) => (
                      <div
                        key={svc.service_id}
                        className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 hover:bg-slate-100/70 hover:border-slate-300 transition-all flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{svc.name}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 font-medium">
                            <span>{svc.category}</span>
                            <span>•</span>
                            <span>{svc.duration_minutes} min</span>
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-emerald-600 font-mono">
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

              <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  {data?.inventory.total_services ?? 0} active services
                </span>
                <button
                  onClick={() => navigate(`/tenant/agents/${activeAgent.agent_id}/services`)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200/80 flex items-center gap-1 transition cursor-pointer"
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
