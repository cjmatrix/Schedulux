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
import { Pagination } from '../../../components/Pagination';
import useDebounceHook from '../../../shared/hooks/useDebounceHook';
import { useDeleteResource, useResourcesList } from '../hooks/useResources';

export default function ResourcesListPage() {
  const navigate = useNavigate();
  const { agentId } = useParams<{ agentId?: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [resourceToDelete, setResourceToDelete] = useState<ResourceInfo | null>(null);

  const [page, setPage] = useState(1);
  const limit = 9;

  const [debouncedSearch] = useDebounceHook(searchTerm);

  // Reset to page 1 whenever search, type, or status filter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedType, selectedStatus]);

  // Single backend-searched, backend-filtered, and paginated query enriched with summary
  const {
    data: resourcesResponse,
    isLoading,
    refetch,
    isRefetching,
  } = useResourcesList({
    page,
    limit,
    resource_type: selectedType === 'all' ? undefined : selectedType,
    dispatch_status: selectedStatus === 'all' ? undefined : selectedStatus,
    agent_id: agentId,
    search: debouncedSearch.trim() || undefined,
  });

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

  // Helper to get total weekly hours from schedule json
  const getWeeklyHours = (jsonStr?: string): string => {
    if (!jsonStr) return 'Standard Hours';
    try {
      const schedule = JSON.parse(jsonStr);
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
      return 'Clinic Hours';
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-20">
      {/* Top Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-4">
        {/* Breadcrumb */}
        {agentId ? (
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-3">
            <button
              onClick={() => navigate('/tenant/agents')}
              className="hover:text-slate-900 transition cursor-pointer"
            >
              AI Agents
            </button>
            <span>/</span>
            <button
              onClick={() => navigate(`/tenant/agents/${agentId}/dashboard`)}
              className="hover:text-slate-900 font-bold transition cursor-pointer"
            >
              {agentId}
            </button>
            <span>/</span>
            <span className="text-slate-900 font-semibold">Resources & Inventory</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-3">
            <span>Tenant Workspace</span>
            <span>/</span>
            <span className="text-slate-900 font-semibold">Resources & Inventory</span>
          </div>
        )}

        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                {agentId ? 'Agent Resources & Inventory' : 'Resources & Inventory'}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {stats.active} Dispatched
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              {agentId
                ? `Configure team members, rooms, and equipment linked to AI agent: ${agentId}`
                : 'Configure team members, meeting rooms, stations, and physical equipment available for autonomous AI booking.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="p-2 rounded-full border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              title="Refresh inventory"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() =>
                navigate(
                  agentId ? `/tenant/agents/${agentId}/resources/new` : '/tenant/inventory/new',
                )
              }
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 text-white text-xs font-semibold hover:bg-black transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Resource</span>
            </button>
          </div>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 my-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">Total Resources</span>
              <Package className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{stats.total}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Physical & staff assets</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">AI Bookable</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-600">{stats.active}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Active for atomic slot locking</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">Staff & Team</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{stats.staffCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Eligible team members</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">Rooms & Equipment</span>
              <Building2 className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{stats.physicalCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Required spaces & equipment</div>
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
                  agentId ? `/tenant/agents/${agentId}/resources/new` : '/tenant/inventory/new',
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
                        onClick={() =>
                          navigate(
                            agentId
                              ? `/tenant/agents/${agentId}/resources/${res.resource_id}`
                              : `/tenant/inventory/${res.resource_id}`,
                          )
                        }
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
      {resourceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Delete "{resourceToDelete.name}"?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently delete this resource? This cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setResourceToDelete(null)}
                className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteResourceMutation.isPending}
                className="px-4 py-2 rounded-full bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-60"
              >
                {deleteResourceMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
