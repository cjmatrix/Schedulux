import type { WorkspaceUserInfo } from '@repo/proto/dashboard';
import { Filter, Plus, Search, Shield, ShieldCheck, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import useDebounceHook from '../../../shared/hooks/useDebounceHook';
import { InviteUserModal } from '../components/InviteUserModal';
import { WorkspaceUsersTable } from '../components/WorkspaceUsersTable';
import { useTenantProfile } from '../hooks/useAuth';
import { useTenantAgents } from '../hooks/useKnowledgeDocuments';
import { useSuspendWorkspaceUser, useWorkspaceUsers } from '../hooks/useTenant';

export default function WorkspaceUsersPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [suspendingUserId, setSuspendingUserId] = useState<string | null>(null);

  const { agentId: routeAgentId } = useParams<{ agentId?: string }>();
  const [searchParams] = useSearchParams();
  const { data: agents = [] } = useTenantAgents();
  const currentAgentId = routeAgentId || searchParams.get('agent_id') || undefined;
  const effectiveAgentId = currentAgentId || (agents.length > 0 ? agents[0].agent_id : undefined);

  const { data: profileData } = useTenantProfile();
  const tenantId = profileData?.data?.tenant_id || '';

  const [finalInput] = useDebounceHook(searchTerm);

  const { data: workspaceData, isLoading } = useWorkspaceUsers(
    tenantId,
    page,
    5,
    finalInput || undefined,
    roleFilter === 'all' ? undefined : roleFilter,
    effectiveAgentId,
  );

  const suspendUserMutation = useSuspendWorkspaceUser();

  const handleToggleSuspend = (user: { user_id: string; name: string; status: string }) => {
    setSuspendingUserId(user.user_id);
    const actionLabel = user.status === 'suspended' ? 'unsuspend' : 'suspend';
    suspendUserMutation.mutate(user.user_id, {
      onSuccess: (res) => {
        toast.success(res.message || `Workspace user ${actionLabel}ed successfully`);
        setSuspendingUserId(null);
      },
      onError: (err) => {
        toast.error(err.message || `Failed to ${actionLabel} workspace user`);
        setSuspendingUserId(null);
      },
    });
  };

  const userList = useMemo(() => {
    const rawUsers = workspaceData?.data?.users;
    if (rawUsers && rawUsers.length > 0) {
      return rawUsers.map((u: WorkspaceUserInfo) => ({
        user_id: u.user_id,
        name: u.name,
        email: u.email,
        system_role: (u.system_role || 'manager') as 'manager',
        agent_id: u.agent_id,
        agent_ids: u.agent_ids,
        status: (u.status || 'active') as 'active' | 'suspended',
        last_active: u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Recently',
      }));
    }
    return [];
  }, [workspaceData]);

  const totalCount = workspaceData?.data?.total_count ?? userList.length;

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto flex flex-col gap-6 sm:gap-8 font-sans">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 tracking-wide flex-wrap">
        <span>Settings &amp; Team</span>
        <span>/</span>
        <span className="text-slate-800 font-bold truncate">Workspace Users</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 sm:pb-6 border-b border-slate-200">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <div className="p-1.5 sm:p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              Workspace Users
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold shrink-0">
              {totalCount} Total
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Manage who has access to the Schedulux dashboard and their permissions.
          </p>
        </div>

        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs self-start sm:self-auto shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Invite User</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200/90 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="appearance-none bg-white border border-slate-200/90 rounded-full px-4 py-2 pr-8 text-xs font-medium text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="all">All Roles ({totalCount})</option>
              <option value="owner">Owner Only</option>
              <option value="manager">Manager Only</option>
            </select>
            <Filter className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      <WorkspaceUsersTable
        users={userList}
        isLoading={isLoading}
        pageSize={5}
        totalCount={totalCount}
        currentPage={page}
        onPageChange={setPage}
        onToggleSuspend={handleToggleSuspend}
        isSuspending={suspendUserMutation.isPending}
        suspendingUserId={suspendingUserId}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs flex flex-col justify-between gap-4">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                ACCESS MATRIX
              </span>
              <Shield className="w-4 h-4 text-slate-700" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Role Capabilities</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Managers handle direct care scheduling and AI monitoring. Clinical Directors and
              Owners retain full control over autonomous parameters and financial tools.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="block text-xl font-extrabold text-slate-900 leading-tight">
                99.4%
              </span>
              <span className="text-[10px] font-semibold text-slate-400">Audit Compliance</span>
            </div>
            <div>
              <span className="block text-xl font-extrabold text-slate-900 leading-tight">2FA</span>
              <span className="text-[10px] font-semibold text-slate-400">Enforced Globally</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs flex flex-col justify-between gap-4">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                AUDIT & SECURITY
              </span>
              <ShieldCheck className="w-4 h-4 text-slate-700" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Session Activity</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              All access modifications, AI prompt updates, and medical record access logs are
              timestamped and exportable for HIPAA compliance reporting.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Last access log updated 8 mins ago</span>
          </div>
        </div>
      </div>

      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        tenantId={tenantId}
        defaultAgentId={effectiveAgentId}
      />
    </div>
  );
}
