import { useState } from 'react';
import {
  Building2,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Download,
  Plus,
  ChevronDown,
  Ban,
} from 'lucide-react';
import { useSuperAdminTenants, useSuspendTenant } from '../hooks/useSuperAdmin';
import useDebounceHook from '../../../shared/hooks/useDebounceHook';

const TIER_COLOR: Record<string, string> = {
  Starter: 'bg-slate-800 text-slate-300 border border-slate-700',
  starter: 'bg-slate-800 text-slate-300 border border-slate-700',
  Pro: 'bg-indigo-900/40 text-indigo-300 border border-indigo-500/30',
  pro: 'bg-indigo-900/40 text-indigo-300 border border-indigo-500/30',
  Enterprise: 'bg-orange-900/30 text-orange-400 border border-orange-500/30',
  enterprise: 'bg-orange-900/30 text-orange-400 border border-orange-500/30',
};

const STATUS_CONFIG: Record<
  string,
  { label: string; dot: string; text: string }
> = {
  active: {
    label: 'Active',
    dot: 'bg-emerald-500',
    text: 'text-slate-200',
  },
  pending: {
    label: 'Pending',
    dot: 'bg-amber-500',
    text: 'text-slate-200',
  },
  suspended: {
    label: 'Suspended',
    dot: 'bg-rose-500',
    text: 'text-rose-400',
  },
};

export default function TenantListPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(7);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebounceHook(searchTerm);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all tiers');

  const suspendTenantMutation = useSuspendTenant();

  const { data: tenantsData, isLoading, isError, refetch } = useSuperAdminTenants(
    page, 
    limit, 
    debouncedSearch || undefined, 
    tierFilter === 'all tiers' ? undefined : tierFilter, 
    statusFilter === 'all' ? undefined : statusFilter
  );

  const rawTenants = tenantsData?.data?.tenants ?? [];
  const totalCount = tenantsData?.data?.total_count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return (
    <div className="flex flex-col min-h-full bg-[#111111] font-sans text-slate-300 p-8">
      
     
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-semibold text-white tracking-tight">Service Owners</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800/80 text-slate-400 border border-slate-700/50">v2.4.12-prod</span>
          </div>
          <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
            Manage tenants, impersonate sessions, and monitor tenant quota ceilings across runtime clusters.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tenant ID, business, email..."
              className="w-72 pl-9 pr-12 py-2 bg-[#1a1a1a] border border-slate-800 rounded-md text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-600 transition-colors"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <span className="text-[9px] font-mono bg-slate-800 px-1 py-0.5 rounded text-slate-400">⌘K</span>
            </div>
          </div>
          
          <div className="relative">
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="appearance-none flex items-center gap-2 pl-3 pr-8 py-2 bg-[#1a1a1a] border border-slate-800 rounded-md text-xs font-medium text-slate-300 hover:bg-slate-800/50 transition-colors focus:outline-none"
            >
              <option value="all tiers">Tier: All Tiers</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none flex items-center gap-2 pl-3 pr-8 py-2 bg-[#1a1a1a] border border-slate-800 rounded-md text-xs font-medium text-slate-300 hover:bg-slate-800/50 transition-colors focus:outline-none"
            >
              <option value="all">Status: All</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <button className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-md text-xs font-medium text-white transition-colors">
            <Plus className="w-4 h-4" /> Provision Tenant
          </button>
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
    
        <div className="bg-[#18181b] border border-slate-800/80 rounded-lg p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-medium text-slate-400 tracking-wider uppercase">Total Tenants</span>
            <Building2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-4xl font-light text-white">{tenantsData?.data.total_count}</span>
            
          </div>
        
        </div>

        
        <div className="bg-[#18181b] border border-slate-800/80 rounded-lg p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-medium text-slate-400 tracking-wider uppercase">Suspended / At Limit</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-4xl font-light text-rose-400">4</span>
            
          </div>
          
        </div>
      </div>

      
      <div className="bg-[#18181b] border border-slate-800/80 rounded-lg overflow-hidden flex flex-col flex-1">
        
       
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-semibold text-slate-200 tracking-wider uppercase">Tenant Fleet Roster</h2>
            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800/60 text-slate-400 border border-slate-700/50">Cluster: us-east-1a</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] border border-slate-700 rounded text-[11px] font-medium text-slate-300 hover:bg-slate-800 transition-colors">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button onClick={() => refetch()} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] border border-slate-700 rounded text-[11px] font-medium text-slate-300 hover:bg-slate-800 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Sync
            </button>
          </div>
        </div>

      
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            <p className="text-sm">Loading fleet roster...</p>
          </div>
        ) : isError ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-rose-400">
            <AlertTriangle className="w-6 h-6" />
            <p className="text-sm">Failed to load tenants.</p>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-[#131313] text-slate-500 border-b border-slate-800/80">
                <tr>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Business / Tenant ID</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Admin Contact</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Plan Tier</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">AI Usage (30D)</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {rawTenants.map((tenant, index) => {
                  const statusInfo = STATUS_CONFIG[tenant.status.toLowerCase()] ?? STATUS_CONFIG.pending;
                  const tierStyle = TIER_COLOR[tenant.tier] ?? TIER_COLOR.Starter;
                  
               
                  const isEnterprise = tenant.tier.toLowerCase() === 'enterprise';
                  const usageRatio = isEnterprise ? 60 : index % 2 === 0 ? 85 : 42;
                  const usageText = isEnterprise ? '6.1k / 10k' : index % 2 === 0 ? '850 / 1k' : '420 / 1k';
                  const usageColor = usageRatio > 80 ? 'bg-orange-400' : 'bg-emerald-500';
                  const usageMsg = usageRatio > 80 ? 'Approaching limit' : 'Optimal capacity';

                  return (
                    <tr key={tenant.tenant_id} className="hover:bg-[#1a1a1a] transition-colors group">
                      
                      {/* Business Name & ID */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded bg-[#2a2a2a] border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-300">
                            {tenant.business_name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-200 block text-sm mb-0.5">
                              {tenant.business_name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {tenant.tenant_id}
                            </span>
                          </div>
                        </div>
                      </td>

                     
                      <td className="px-5 py-3.5">
                        <span className="block text-slate-300 mb-1">{tenant.contact_email}</span>
                        <div className="flex items-center gap-1 text-[10px] text-emerald-500">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Verified 2FA</span>
                        </div>
                      </td>

                      
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-sm text-[10px] font-medium ${tierStyle}`}>
                          {tenant.tier || 'Starter'}
                        </span>
                      </td>

                      {/* AI Usage */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-between text-[10px] mb-1.5">
                          <span className="text-slate-300 font-medium">{usageText}</span>
                          <span className={`${usageRatio > 80 ? 'text-orange-400' : 'text-emerald-500'}`}>
                            {usageMsg}
                          </span>
                        </div>
                        <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full ${usageColor} rounded-full`} style={{ width: `${usageRatio}%` }} />
                        </div>
                      </td>

       
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                          <span className={`text-[11px] font-medium ${statusInfo.text}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        {tenant.status === 'suspended' && (
                          <span className="block text-[10px] text-rose-500/70 mt-0.5 ml-3.5">(Limit Exceeded)</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        {tenant.status === 'active' ? (
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to suspend tenant "${tenant.business_name}"?`)) {
                                suspendTenantMutation.mutate(tenant.tenant_id);
                              }
                            }}
                            disabled={suspendTenantMutation.isPending}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 rounded transition-colors disabled:opacity-50"
                          >
                            {suspendTenantMutation.isPending && suspendTenantMutation.variables === tenant.tenant_id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Ban className="w-3 h-3 text-rose-400" />
                            )}
                            Suspend
                          </button>
                        ) : tenant.status === 'suspended' ? (
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to reactivate tenant "${tenant.business_name}"?`)) {
                                suspendTenantMutation.mutate(tenant.tenant_id);
                              }
                            }}
                            disabled={suspendTenantMutation.isPending}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-emerald-300 hover:text-white bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/50 rounded transition-colors disabled:opacity-50"
                          >
                            {suspendTenantMutation.isPending && suspendTenantMutation.variables === tenant.tenant_id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            )}
                            Unsuspend
                          </button>
                        ) : (
                          <button
                            disabled
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-slate-500 bg-slate-900/50 border border-slate-800 rounded cursor-not-allowed opacity-50"
                          >
                            Pending
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-5 py-3 border-t border-slate-800/80 bg-[#131313] flex items-center justify-between">
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>Showing {totalCount === 0 ? 0 : (page - 1) * limit + 1} to {Math.min(page * limit, totalCount)} of {totalCount} results</span>
           
          </div>

          <div className="flex items-center gap-1">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-800 text-slate-400 text-[11px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-800 text-slate-400 text-[11px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
