import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bot,
  Plus,
  Search,
  Sparkles,
  ArrowRight,
  Clock,
  Layers,
  Globe,
  Settings2,
  RefreshCw,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { knowledgeApi, type AgentSummaryInfo } from "../../../api/knowledgeApi.js";

export default function TenantAgentsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "created" | "pending">("all");

  const {
    data: agentsResponse,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["tenant-agents"],
    queryFn: () => knowledgeApi.listTenantAgents(),
  });

  const agents: AgentSummaryInfo[] = agentsResponse?.data || [];

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const matchesSearch =
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.agent_id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ? true : agent.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [agents, searchTerm, statusFilter]);

  const createdCount = agents.filter((a) => a.status === "created").length;
  const pendingCount = agents.filter((a) => a.status === "pending").length;

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 tracking-wide">
        <span>Dashboard</span>
        <span>/</span>
        <span className="text-slate-800">AI Agents</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Bot className="w-8 h-8 text-neutral-900" />
              AI Scheduling Agents
            </h1>
            <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {agents.length} Total
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Manage your AI agents. Drafts are staged in AgentDraft until deployed to AgentRuntimeConfig.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-2.5 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition cursor-pointer disabled:opacity-50"
            title="Refresh Agents"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => navigate("/tenant/landingboard")}
            className="flex items-center gap-2 bg-neutral-950 hover:bg-neutral-800 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-xs transition active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create New Agent</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Agents
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {agents.length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <Bot className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Created (Live)
            </p>
            <p className="text-2xl font-black text-emerald-950 mt-1">
              {createdCount}
            </p>
            <span className="text-[10px] text-emerald-600">
              In AgentRuntimeConfig
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
            LIVE
          </div>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Pending (Drafts)
            </p>
            <p className="text-2xl font-black text-amber-950 mt-1">
              {pendingCount}
            </p>
            <span className="text-[10px] text-amber-600">
              In AgentDraft collection
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs">
            DRAFT
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search agents by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              statusFilter === "all"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All ({agents.length})
          </button>
          <button
            onClick={() => setStatusFilter("created")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              statusFilter === "created"
                ? "bg-emerald-600 text-white"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            Created ({createdCount})
          </button>
          <button
            onClick={() => setStatusFilter("pending")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              statusFilter === "pending"
                ? "bg-amber-600 text-white"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            Pending ({pendingCount})
          </button>
        </div>
      </div>

      {/* Agents Grid / List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Loading agents...</p>
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400">
            <Bot className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {searchTerm || statusFilter !== "all"
                ? "No matching agents found"
                : "No AI agents created yet"}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              {searchTerm || statusFilter !== "all"
                ? "Try clearing your search query or filter."
                : "Crawl your website or pick a template to generate and stage your first AI agent."}
            </p>
          </div>
          <button
            onClick={() => navigate("/tenant/landingboard")}
            className="flex items-center gap-2 bg-neutral-950 hover:bg-neutral-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Crawl Website & Create Agent</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAgents.map((agent) => {
            const isCreated = agent.status === "created";

            return (
              <div
                key={agent.agent_id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-5 group"
              >
                {/* Top: Status & Source */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {isCreated ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Created
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Pending Draft
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] font-semibold text-slate-400 capitalize flex items-center gap-1">
                    {agent.creation_source === "web_crawl" ? (
                      <>
                        <Globe className="w-3 h-3" /> Web Crawl
                      </>
                    ) : (
                      <>
                        <FileText className="w-3 h-3" /> {agent.creation_source}
                      </>
                    )}
                  </span>
                </div>

                {/* Middle: Title & Details */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-neutral-900 transition leading-snug">
                    {agent.name}
                  </h3>
                  <p className="font-mono text-[11px] text-slate-400 mt-1 truncate">
                    {agent.agent_id}
                  </p>

                  <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      {agent.services_count} {agent.services_count === 1 ? "Service" : "Services"}
                    </span>
                    <span>•</span>
                    <span className="text-slate-400">
                      {agent.updated_at
                        ? `Updated ${new Date(agent.updated_at).toLocaleDateString()}`
                        : "Draft"}
                    </span>
                  </div>
                </div>

                {/* Bottom: Action Button */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="text-[10px] font-semibold text-slate-400">
                    {isCreated ? "Saved in AgentRuntimeConfig" : "Saved in AgentDraft"}
                  </span>

                  <button
                    onClick={() => {
                      navigate(`/tenant/agent-setup/${agent.agent_id}`);
                    }}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      isCreated
                        ? "bg-slate-100 text-slate-800 hover:bg-slate-200"
                        : "bg-neutral-950 text-white hover:bg-neutral-800 shadow-2xs"
                    }`}
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span>Configure / Edit</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
