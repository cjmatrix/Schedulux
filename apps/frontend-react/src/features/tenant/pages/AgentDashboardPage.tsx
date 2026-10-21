import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Bot,
  ChevronRight,
  Package,
  Settings2,
  Sparkles,
  Tag,
  Users,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { knowledgeApi } from '../../../api/knowledgeApi';
import { servicesApi } from '../api/servicesApi';

export default function AgentDashboardPage() {
  const navigate = useNavigate();
  const { agentId } = useParams<{ agentId: string }>();

  const { data: agentsResponse, isLoading: agentsLoading } = useQuery({
    queryKey: ['tenant-agents'],
    queryFn: () => knowledgeApi.listTenantAgents(),
    staleTime: 60_000,
  });

  const agentInfo = agentsResponse?.data?.find((a) => a.agent_id === agentId);

  const { data: servicesResponse, isLoading: servicesLoading } = useQuery({
    queryKey: ['scheduling-services', { agent_id: agentId }],
    queryFn: () => servicesApi.listServices({ agent_id: agentId, limit: 5 }),
    enabled: Boolean(agentId),
    staleTime: 30_000,
  });

  const { data: resourcesResponse, isLoading: resourcesLoading } = useQuery({
    queryKey: ['scheduling-resources', { agent_id: agentId }],
    queryFn: () => servicesApi.listResources({ agent_id: agentId, limit: 5 }),
    enabled: Boolean(agentId),
    staleTime: 30_000,
  });

  const services = servicesResponse?.data || [];
  const resources = resourcesResponse?.data || [];
  const totalServices = servicesResponse?.pagination?.total ?? services.length;
  const totalResources = resourcesResponse?.pagination?.total ?? resources.length;

  const isLoading = agentsLoading;
  const isLive = agentInfo?.status === 'created';

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-6 font-sans">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 tracking-wide">
        <button
          onClick={() => navigate('/tenant/agents')}
          className="flex items-center gap-1 hover:text-slate-800 transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          AI Agents
        </button>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <span className="text-slate-700 font-bold truncate max-w-xs">
          {agentInfo?.name || agentId}
        </span>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <span className="text-slate-900">Dashboard</span>
      </div>

      {/* Agent Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center shadow-md shrink-0">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <div>
            {isLoading ? (
              <div className="w-40 h-6 bg-slate-100 rounded-lg animate-pulse mb-2" />
            ) : (
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {agentInfo?.name || agentId}
              </h1>
            )}
            <div className="flex items-center gap-2 mt-1">
              {isLive ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Draft
                </span>
              )}
              <span className="font-mono text-[11px] text-slate-400 truncate">{agentId}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => navigate(`/tenant/agent-setup/${agentId}`)}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5" />
            Configure Agent
          </button>
          <button
            onClick={() => navigate(`/tenant/agents/${agentId}/services`)}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Manage Services
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          onClick={() => navigate(`/tenant/agents/${agentId}/services`)}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex items-center justify-between hover:shadow-md hover:border-slate-300 transition cursor-pointer group"
        >
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Services</p>
            <p className="text-4xl font-black text-slate-900 mt-1">
              {servicesLoading ? '—' : totalServices}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Assigned to this agent</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center text-slate-600 transition">
            <Tag className="w-6 h-6" />
          </div>
        </div>

        <div
          onClick={() => navigate(`/tenant/agents/${agentId}/resources`)}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex items-center justify-between hover:shadow-md hover:border-slate-300 transition cursor-pointer group"
        >
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resources</p>
            <p className="text-4xl font-black text-slate-900 mt-1">
              {resourcesLoading ? '—' : totalResources}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Staff, rooms & assets</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center text-slate-600 transition">
            <Package className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Recent services preview */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Tag className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900">Services</h2>
            <span className="bg-slate-100 text-slate-600 text-[11px] font-bold px-2 py-0.5 rounded-full">
              {totalServices}
            </span>
          </div>
          <button
            onClick={() => navigate(`/tenant/agents/${agentId}/services`)}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition cursor-pointer"
          >
            View all <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {servicesLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading...</div>
        ) : services.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-xs text-slate-500 mb-3">No services yet for this agent.</p>
            <button
              onClick={() => navigate(`/tenant/agents/${agentId}/services/new`)}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-black transition cursor-pointer"
            >
              + Add First Service
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {services.slice(0, 5).map((s) => (
              <div
                key={s.service_id}
                className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{s.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {s.category} ·{' '}
                    {s.booking_mode === 'date_range' ? 'Date Range' : `${s.duration_minutes} min`}
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                  ${(s.price?.amount ?? 0).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent resources preview */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900">Resources</h2>
            <span className="bg-slate-100 text-slate-600 text-[11px] font-bold px-2 py-0.5 rounded-full">
              {totalResources}
            </span>
          </div>
          <button
            onClick={() => navigate(`/tenant/agents/${agentId}/resources`)}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition cursor-pointer"
          >
            View all <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {resourcesLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading...</div>
        ) : resources.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-xs text-slate-500 mb-3">No resources yet for this agent.</p>
            <button
              onClick={() => navigate(`/tenant/agents/${agentId}/resources/new`)}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-black transition cursor-pointer"
            >
              + Add First Resource
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {resources.slice(0, 5).map((r) => (
              <div
                key={r.resource_id}
                className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{r.name}</p>
                  <p className="text-[11px] text-slate-400 capitalize">
                    {r.resource_type} · {r.category}
                  </p>
                </div>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full border capitalize ${
                    r.dispatch_status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {r.dispatch_status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
