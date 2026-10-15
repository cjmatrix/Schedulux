import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Tag,
  Plus,
  Search,
  Clock,
  Shield,
  Trash2,
  Edit,
  DollarSign,
  Users,
  Building2,
  RefreshCw,
  Loader2,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { useServicesList, useDeleteService } from '../hooks/useServices';
import type { ServiceInfo } from '@repo/proto/scheduling';
import useDebounceHook from '../../../shared/hooks/useDebounceHook';

export default function ServicesListPage() {
  const navigate = useNavigate();
  const { agentId } = useParams<{ agentId?: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [serviceToDelete, setServiceToDelete] = useState<ServiceInfo | null>(null);

  const [debouncedSearch] = useDebounceHook(searchTerm);

  const { data: servicesResponse, isLoading, refetch, isRefetching } = useServicesList({
    limit: 100,
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    agent_id: agentId,
  });

  const deleteServiceMutation = useDeleteService();

  const services = servicesResponse?.data || [];

  // Filtered by search term
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        s.category.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        s.service_id.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (s.description || '').toLowerCase().includes(debouncedSearch.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' || s.category.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [services, debouncedSearch, selectedCategory]);

  // Unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    services.forEach((s) => {
      if (s.category) set.add(s.category);
    });
    return Array.from(set);
  }, [services]);

  // Summary Metrics
  const totalCount = services.length;
  const depositCount = services.filter((s) => s.deposit?.required).length;
  const avgPrice =
    totalCount > 0
      ? (services.reduce((acc, s) => acc + (s.price?.amount || 0), 0) / totalCount).toFixed(2)
      : '0.00';

  const handleDeleteConfirm = async () => {
    if (!serviceToDelete) return;
    try {
      await deleteServiceMutation.mutateAsync(serviceToDelete.service_id);
      setServiceToDelete(null);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete service');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-6 font-sans text-slate-800">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 tracking-wide">
        {agentId ? (
          <>
            <button
              onClick={() => navigate('/tenant/agents')}
              className="flex items-center gap-1 hover:text-slate-800 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              AI Agents
            </button>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <button
              onClick={() => navigate(`/tenant/agents/${agentId}/dashboard`)}
              className="hover:text-slate-800 transition cursor-pointer font-bold truncate max-w-xs"
            >
              {agentId}
            </button>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="text-slate-900 font-bold">Services</span>
          </>
        ) : (
          <>
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-slate-800 font-bold">Services & Pricing</span>
          </>
        )}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Tag className="w-8 h-8 text-neutral-900" />
              {agentId ? 'Agent Services & Pricing' : 'Services & Pricing Catalog'}
            </h1>
            <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {totalCount} Total
            </span>
          </div>
          <p className="text-sm text-slate-500">
            {agentId
              ? `Configure execution durations, fees, and rules for AI agent: ${agentId}`
              : 'Configure clinical execution durations, fee schedules, deposits, and multi-resource allocation rules.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-2.5 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition cursor-pointer disabled:opacity-50"
            title="Refresh Services"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => navigate(agentId ? `/tenant/agents/${agentId}/services/new` : '/tenant/services/new')}
            className="flex items-center gap-2 bg-slate-950 hover:bg-black text-white px-5 py-2.5 rounded-xl font-semibold text-xs shadow-xs transition active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Service</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Services</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{totalCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Automated triage enabled</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Tag className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Fee</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">${avgPrice}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Across all active tiers</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Deposit Enforced</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{depositCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Requires upfront booking hold</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search services by name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition shadow-2xs"
          />
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                selectedCategory.toLowerCase() === cat.toLowerCase()
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3 text-slate-600" />
          <p className="text-xs font-semibold">Loading catalog services...</p>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-4 shadow-2xs">
          <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
            <Tag className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No Services Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              {searchTerm || selectedCategory !== 'all'
                ? 'No services match your active search or category filters.'
                : 'Get started by creating your first service offering.'}
            </p>
          </div>
          <button
            onClick={() => navigate('/tenant/services/new')}
            className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Service</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServices.map((service) => {
            const price = service.price?.amount ?? 0;
            const currency = service.price?.currency || 'USD';
            const depositRequired = service.deposit?.required;
            const depositAmount = service.deposit?.amount ?? 0;

            const staffCount = service.eligible_resource_ids?.length || 0;
            const assetCount = service.required_asset_ids?.length || 0;

            return (
              <div
                key={service.service_id}
                className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-3xl p-6 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between gap-5 group"
              >
                {/* Top Details */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
                      {service.category || 'General'}
                    </span>
                    <span className="text-xs font-extrabold text-slate-900 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-100">
                      ${price.toFixed(2)} {currency}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-black transition">
                    {service.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {service.description || 'No detailed clinical description provided.'}
                  </p>
                </div>

                {/* Badges / Metrics */}
                <div className="flex flex-col gap-2.5 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {service.booking_mode === 'date_range' ? 'Daily / Date Range' : `${service.duration_minutes} min slot`}
                      {service.buffer_minutes ? ` (+${service.buffer_minutes}m buffer)` : ''}
                    </span>

                    {depositRequired ? (
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                        Hold: ${depositAmount.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">No deposit</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-400" />
                      {staffCount} {staffCount === 1 ? 'practitioner' : 'practitioners'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      {assetCount} {assetCount === 1 ? 'asset' : 'assets'}
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => navigate(agentId ? `/tenant/agents/${agentId}/services/${service.service_id}` : `/tenant/services/${service.service_id}`)}
                    className="flex-1 py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 border border-slate-200 transition cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5 text-slate-600" />
                    <span>Edit Service</span>
                  </button>

                  <button
                    onClick={() => setServiceToDelete(service)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-xl transition cursor-pointer"
                    title="Delete Service"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {serviceToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 flex flex-col gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Service?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <strong className="text-slate-800">{serviceToDelete.name}</strong>?
                This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => setServiceToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteServiceMutation.isPending}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {deleteServiceMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
