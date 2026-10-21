import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Bot,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  FileText,
  Globe,
  Layers,
  LayoutDashboard,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Sparkles,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { type AgentSummaryInfo, knowledgeApi } from '../../../api/knowledgeApi.js';
import { useAuthStore } from '../../../store/useAuthStore.js';
import { useLogout, useTenantProfile } from '../hooks/useAuth.js';

export default function TenantAgentsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'created' | 'pending'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: profileData } = useTenantProfile();
  const authUser = useAuthStore((state) => state.user);
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => navigate('/login'),
      onError: () => navigate('/login'),
    });
  };

  const {
    data: agentsResponse,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['tenant-agents'],
    queryFn: () => knowledgeApi.listTenantAgents(),
  });

  const agents: AgentSummaryInfo[] = agentsResponse?.data || [];

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const matchesSearch =
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.agent_id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' ? true : agent.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [agents, searchTerm, statusFilter]);

  const createdCount = agents.filter((a) => a.status === 'created').length;
  const pendingCount = agents.filter((a) => a.status === 'pending').length;

  const currentTenant = profileData?.data;
  const currentBusinessName =
    currentTenant?.business_name || authUser?.business_name || 'My Workspace';
  const currentUserFullName =
    authUser?.name ||
    authUser?.email?.split('@')[0] ||
    currentTenant?.business_name ||
    'Tenant Owner';
  const currentUserRole =
    authUser?.system_role === 'root'
      ? 'Root Admin'
      : authUser?.system_role === 'manager'
        ? 'Manager'
        : 'Tenant Owner';
  const userInitials = currentUserFullName.substring(0, 2).toUpperCase();

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans">
      {/* Standalone Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 sm:px-10 h-16 flex items-center justify-between shrink-0 shadow-2xs">
        {/* Brand Logo & Workspace Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center font-black text-sm shadow-sm">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-slate-900 tracking-tight text-base leading-none">
                Schedulux AI
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide mt-0.5">
                Multi-Agent Workspace
              </span>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-xs font-semibold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{currentBusinessName}</span>
          </div>
        </div>

        {/* User Profile & Sign Out */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-slate-200/80 bg-white">
            <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
              {userInitials}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 leading-tight">
                {currentUserFullName}
              </span>
              <span className="text-[9px] text-slate-400 capitalize">{currentUserRole}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            title="Sign Out"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-rose-100"
          >
            {logoutMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-10 flex flex-col gap-8">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-neutral-900 flex items-center justify-center text-white shadow-sm">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  AI Agents Dashboard
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Manage your scheduling bots. Each agent has its own dedicated services, resources,
                  and knowledge.
                </p>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="p-2.5 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl transition cursor-pointer shadow-2xs disabled:opacity-50"
              title="Refresh Agents"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => navigate('/tenant/landingboard')}
              className="flex items-center gap-2 bg-neutral-950 hover:bg-neutral-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition active:scale-98 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>+ Create New Agent</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total Agents
              </p>
              <p className="text-3xl font-black text-slate-900 mt-1">{agents.length}</p>
              <span className="text-[11px] text-slate-500">Across this workspace</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Bot className="w-6 h-6" />
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Live Agents
              </p>
              <p className="text-3xl font-black text-emerald-950 mt-1">{createdCount}</p>
              <span className="text-[11px] text-emerald-700 font-medium">
                Active in Runtime Config
              </span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold text-xs shadow-2xs">
              LIVE
            </div>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Pending Drafts
              </p>
              <p className="text-3xl font-black text-amber-950 mt-1">{pendingCount}</p>
              <span className="text-[11px] text-amber-700 font-medium">In Draft Setup</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-800 font-bold text-xs shadow-2xs">
              DRAFT
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by agent name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({agents.length})
            </button>
            <button
              onClick={() => setStatusFilter('created')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'created'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              Live ({createdCount})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'pending'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              Drafts ({pendingCount})
            </button>
          </div>
        </div>

        {/* Agents Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white rounded-3xl border border-slate-200">
            <div className="w-9 h-9 border-3 border-neutral-900 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-medium">Loading AI agents...</p>
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-16 text-center flex flex-col items-center gap-4 shadow-2xs">
            <div className="w-16 h-16 rounded-3xl bg-neutral-100 flex items-center justify-center text-neutral-400 shadow-inner">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {searchTerm || statusFilter !== 'all'
                  ? 'No matching agents found'
                  : 'No AI agents created yet'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try clearing your search query or switching filters.'
                  : 'Get started by generating your first AI scheduling agent from your website URL or picking a template.'}
              </p>
            </div>
            <button
              onClick={() => navigate('/tenant/landingboard')}
              className="flex items-center gap-2 bg-neutral-950 hover:bg-neutral-800 text-white px-6 py-3 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer mt-2"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>+ Create First Agent</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => {
              const isCreated = agent.status === 'created';

              return (
                <div
                  key={agent.agent_id}
                  className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs hover:shadow-lg hover:border-slate-300 transition-all flex flex-col justify-between gap-6 group"
                >
                  {/* Top: Status & Creation Source */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isCreated ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Live Agent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Pending Draft
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] font-semibold text-slate-400 capitalize flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                      {agent.creation_source === 'web_crawl' ? (
                        <>
                          <Globe className="w-3 h-3 text-indigo-500" /> Web Crawl
                        </>
                      ) : (
                        <>
                          <FileText className="w-3 h-3 text-slate-500" /> {agent.creation_source}
                        </>
                      )}
                    </span>
                  </div>

                  {/* Body: Agent Name & ID & Stats */}
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-black transition leading-snug">
                      {agent.name}
                    </h3>

                    {/* Agent ID with Copy Button */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md truncate max-w-[200px]">
                        {agent.agent_id}
                      </span>
                      <button
                        onClick={(e) => handleCopyId(agent.agent_id, e)}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition cursor-pointer"
                        title="Copy Agent ID"
                      >
                        {copiedId === agent.agent_id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Meta info */}
                    <div className="mt-5 flex items-center gap-4 text-xs text-slate-500 border-t border-slate-100 pt-3">
                      <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                        <Layers className="w-3.5 h-3.5 text-indigo-500" />
                        {agent.services_count} {agent.services_count === 1 ? 'Service' : 'Services'}
                      </span>
                      <span>•</span>
                      <span className="text-slate-400 text-[11px]">
                        {agent.updated_at
                          ? `Updated ${new Date(agent.updated_at).toLocaleDateString()}`
                          : 'Draft'}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Action Buttons */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    {/* Edit button: calls resume agent onboarding querying agent draft */}
                    <button
                      type="button"
                      onClick={() => navigate(`/tenant/agent-setup/${agent.agent_id}`)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                      title="Resume onboarding and edit draft schema"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                      <span>{isCreated ? 'Edit Config' : 'Resume Setup'}</span>
                    </button>

                    {/* Go to Dashboard button: enters TenantLayout for this agent */}
                    <button
                      type="button"
                      onClick={() => navigate(`/tenant/agents/${agent.agent_id}/dashboard`)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-neutral-950 text-white hover:bg-neutral-800 shadow-2xs transition active:scale-98 cursor-pointer"
                      title="Open operational dashboard for this agent"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      <span>Go to Dashboard</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
