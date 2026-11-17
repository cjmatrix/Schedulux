import type { ResourceInfo } from '@repo/proto/scheduling';
import {
  Armchair,
  Building2,
  Car,
  CheckCircle2,
  Clock,
  Edit,
  Package,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  Wrench,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ConfirmationModal } from '../../../components/ConfirmationModal.js';
import { Pagination } from '../../../components/Pagination';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import useDebounceHook from '../../../shared/hooks/useDebounceHook';
import { useTenantAgents } from '../hooks/useKnowledgeDocuments';
import { useDeleteResource, useResourcesList } from '../hooks/useResources';

export default function ResourcesListPage() {
  const navigate = useNavigate();
  const { agentId } = useParams<{ agentId?: string }>();
  const { user: authUser, isManager } = useCurrentUser();
  const { data: agents = [] } = useTenantAgents();

  const effectiveAgentId =
    agentId || authUser?.agent_id || (agents.length > 0 ? agents[0].agent_id : undefined);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [resourceToDelete, setResourceToDelete] = useState<ResourceInfo | null>(null);

  const [page, setPage] = useState(1);
  const limit = 9;

  const [debouncedSearch] = useDebounceHook(searchTerm);

 
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedType, selectedStatus]);


  const {
    data: resourcesResponse,
    isLoading,
    refetch,
    isRefetching,
  } = useResourcesList(
    {
      page,
      limit,
      resource_type: selectedType === 'all' ? undefined : selectedType,
      dispatch_status: selectedStatus === 'all' ? undefined : selectedStatus,
      agent_id: effectiveAgentId,
      search: debouncedSearch.trim() || undefined,
    },
    { enabled: true },
  );

  const deleteResourceMutation = useDeleteResource();

  const filteredResources: ResourceInfo[] = resourcesResponse?.data || [];
  const summary = resourcesResponse?.summary;

  const total = resourcesResponse?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const stats = {
    total: summary?.total_count ?? total,
    active: summary?.active_count ?? 0,
    staffCount: summary?.staff_count ?? 0,
    physicalCount: summary?.physical_count ?? 0,
  };

  const handleDeleteConfirm = async () => {
    if (!resourceToDelete) return;
    try {
      await deleteResourceMutation.mutateAsync(resourceToDelete.resource_id);
      setResourceToDelete(null);
    } catch (err) {
      console.error('Failed to delete resource:', err);
    }
  };

  const getInitials = (name?: string) => {
    if (!name?.trim()) return 'RS';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };


  const getWeeklyHours = (jsonStr?: string): string => {
    if (!jsonStr || jsonStr.trim() === '' || jsonStr.trim() === '{}') return 'Standard Hours';
    try {
      const schedule = JSON.parse(jsonStr);
      if (!schedule || typeof schedule !== 'object' || Object.keys(schedule).length === 0) {
        return 'Standard Hours';
      }
      let total = 0;
      let activeDays = 0;
      for (const day of Object.keys(schedule)) {
        const shifts = schedule[day];
        if (Array.isArray(shifts) && shifts.length > 0) {
          activeDays++;
          for (const s of shifts) {
            if (s.start && s.end) {
              const [sh, sm] = s.start.split(':').map(Number);
              const [eh, em] = s.end.split(':').map(Number);
              if (!isNaN(sh) && !isNaN(eh)) {
                const diff = eh * 60 + em - (sh * 60 + sm);
                if (diff > 0) total += diff;
              }
            }
          }
        }
      }
      if (activeDays === 0) return 'Custom Off';
      return `${(total / 60).toFixed(0)} hrs / ${activeDays} days`;
    } catch {
      return 'Standard Hours';
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-20">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 md:pt-8 pb-4">
        {/* Breadcrumb */}
        {isManager ? (
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-slate-400 tracking-wide mb-3 flex-wrap">
            <span>Operations</span>
            <span>/</span>
            <span className="text-slate-900 font-bold">Resources &amp; Inventory</span>
          </div>
        ) : effectiveAgentId ? (
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-medium text-slate-500 mb-3 flex-wrap">
            <button
              onClick={() => navigate('/tenant/agents')}
              className="hover:text-slate-900 transition cursor-pointer"
            >
              AI Agents
            </button>
            <span>/</span>
            <button
              onClick={() => navigate(`/tenant/agents/${effectiveAgentId}/dashboard`)}
              className="hover:text-slate-900 font-bold transition cursor-pointer truncate max-w-[140px] sm:max-w-none"
            >
              {effectiveAgentId}
            </button>
            <span>/</span>
            <span className="text-slate-900 font-semibold truncate">Resources &amp; Inventory</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-medium text-slate-500 mb-3 flex-wrap">
            <span>Tenant Workspace</span>
            <span>/</span>
            <span className="text-slate-900 font-semibold">Resources &amp; Inventory</span>
          </div>
        )}

        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 sm:pb-6 border-b border-slate-200">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <div className="p-1.5 sm:p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                <Package className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                {effectiveAgentId ? 'Agent Resources & Inventory' : 'Resources & Inventory'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold shrink-0">
                {stats.active} Dispatched
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              {effectiveAgentId
                ? 'Configure team members, rooms, and equipment linked to this AI agent.'
                : 'Configure team members, meeting rooms, stations, and physical equipment available for autonomous AI booking.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="p-2 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-xl transition cursor-pointer disabled:opacity-50 shadow-2xs"
              title="Refresh inventory"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
            <button
              onClick={() => {
                if (effectiveAgentId) {
                  navigate(`/tenant/agents/${effectiveAgentId}/resources/new`);
                } else {
                  navigate('/tenant/inventory/new');
                }
              }}
              className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-slate-900 text-white text-xs font-semibold hover:bg-black transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Resource</span>
            </button>
          </div>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 my-4 sm:my-6">
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] sm:text-xs font-medium truncate">Total Resources</span>
              <Package className="w-4 h-4 text-slate-400 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900">{stats.total}</div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">Physical &amp; staff assets</div>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] sm:text-xs font-medium truncate">AI Bookable</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-600">{stats.active}</div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">Active for slot locking</div>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] sm:text-xs font-medium truncate">Staff &amp; Team</span>
              <Users className="w-4 h-4 text-slate-400 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900">{stats.staffCount}</div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">Eligible team members</div>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] sm:text-xs font-medium truncate">Rooms &amp; Equipment</span>
              <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900">{stats.physicalCount}</div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">Spaces &amp; equipment</div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, role, title, category..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 shadow-2xs"
            />
          </div>

          {/* Type Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            {[
              { id: 'all', label: 'All' },
              { id: 'staff', label: 'Staff' },
              { id: 'room', label: 'Rooms' },
              { id: 'chair', label: 'Chairs' },
              { id: 'equipment', label: 'Equipment' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`px-3 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  selectedType === tab.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200/80 text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">Status: All</option>
              <option value="active">Active Only</option>
              <option value="on_leave">On Leave</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
            </select>
          </div>
        </div>

        {/* Resources Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl p-6 border border-slate-200/70 shadow-2xs animate-pulse space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="w-3/4 h-4 bg-slate-200 rounded" />
                    <div className="w-1/2 h-3 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="w-full h-8 bg-slate-100 rounded-xl" />
                <div className="w-full h-12 bg-slate-100 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-2xs space-y-4 my-6">
            <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Package className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">No resources found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {searchTerm || selectedType !== 'all' || selectedStatus !== 'all'
                  ? 'No resources match your search criteria. Try resetting the filters.'
                  : 'Start adding team members, spaces, and equipment to your scheduling inventory.'}
              </p>
            </div>
            <button
              onClick={() =>
                navigate(
                  effectiveAgentId
                    ? `/tenant/agents/${effectiveAgentId}/resources/new`
                    : '/tenant/inventory/new',
                )
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 text-white text-xs font-semibold hover:bg-black transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Resource</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredResources.map((res) => {
              const isStaff = res.resource_type === 'staff';
              const isActive = res.dispatch_status === 'active';
              const weeklyHours = getWeeklyHours(res.custom_shift_overrides_json);

              return (
                <div
                  key={res.resource_id}
                  className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-slate-300/80 transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Card Top: Avatar & Status */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <div className="w-12 h-12 rounded-full bg-slate-950 text-white font-bold text-sm flex items-center justify-center shadow-inner tracking-wider">
                            {isStaff ? (
                              getInitials(res.name)
                            ) : res.resource_type === 'room' || res.resource_type === 'bay' ? (
                              <Building2 className="w-5 h-5 text-slate-300" />
                            ) : res.resource_type === 'chair' ? (
                              <Armchair className="w-5 h-5 text-slate-300" />
                            ) : res.resource_type === 'vehicle' ? (
                              <Car className="w-5 h-5 text-slate-300" />
                            ) : (
                              <Wrench className="w-5 h-5 text-slate-300" />
                            )}
                          </div>
                          {isActive && (
                            <span
                              className="w-3 h-3 bg-emerald-500 rounded-full border-2 border-white absolute bottom-0 right-0 shadow-2xs"
                              title="Active for AI Dispatch"
                            />
                          )}
                          {res.dispatch_status === 'on_leave' && (
                            <span
                              className="w-3 h-3 bg-amber-500 rounded-full border-2 border-white absolute bottom-0 right-0 shadow-2xs"
                              title="On Leave"
                            />
                          )}
                          {res.dispatch_status === 'maintenance' && (
                            <span
                              className="w-3 h-3 bg-orange-500 rounded-full border-2 border-white absolute bottom-0 right-0 shadow-2xs"
                              title="Maintenance"
                            />
                          )}
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-slate-950 group-hover:text-slate-800 transition-colors line-clamp-1">
                            {res.name}
                          </h3>
                          <p className="text-[11px] text-slate-500 font-medium line-clamp-1">
                            {res.title || res.category || 'Resource Asset'}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0 ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : res.dispatch_status === 'on_leave'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {res.dispatch_status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Metadata Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-3.5">
                      <span className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-semibold capitalize">
                        {res.resource_type}
                      </span>
                      {res.category && (
                        <span className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-50 text-slate-600 border border-slate-200/60 font-medium">
                          {res.category}
                        </span>
                      )}
                      {res.is_bookable && (
                        <span className="text-[11px] px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-medium border border-indigo-100">
                          AI Bookable
                        </span>
                      )}
                    </div>

                    {/* Working Hours Bar */}
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#f8fafc] border border-slate-200/60 text-slate-600 text-xs mb-3">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-[11px] font-medium text-slate-700 truncate">
                        {weeklyHours}
                      </span>
                    </div>

                    {/* Clinical Notes Snippet */}
                    {res.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-4">
                        {res.description}
                      </p>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
                    <span className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
                      {res.resource_id}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setResourceToDelete(res)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete resource"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (effectiveAgentId) {
                            navigate(
                              `/tenant/agents/${effectiveAgentId}/resources/${res.resource_id}`,
                            );
                          } else {
                            navigate(`/tenant/inventory/${res.resource_id}`);
                          }
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Edit className="w-3 h-3 text-slate-400" />
                        <span>Edit Profile</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Reusable Pagination Component */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalCount={total}
          pageSize={limit}
          onPageChange={setPage}
          isLoading={isLoading}
          entityName="resources"
          variant="standalone"
        />
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(resourceToDelete)}
        onClose={() => setResourceToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title={`Delete "${resourceToDelete?.name}"?`}
        description="Are you sure you want to permanently delete this resource? This cannot be undone."
        variant="delete"
        confirmText="Confirm Delete"
        isLoading={deleteResourceMutation.isPending}
      />
    </div>
  );
}
