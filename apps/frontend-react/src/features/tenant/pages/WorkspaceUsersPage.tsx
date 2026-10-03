import { useState, useMemo } from "react";
import { Plus, Search, Filter, Shield, ShieldCheck } from "lucide-react";
import { useWorkspaceUsers } from "../hooks/useTenant";
import { useTenantProfile } from "../hooks/useAuth";
import { InviteUserModal } from "../components/InviteUserModal";
import { WorkspaceUsersTable } from "../components/WorkspaceUsersTable";
import type { WorkspaceUserInfo } from "@repo/proto/dashboard";
import useDebounceHook from "../../../shared/hooks/useDebounceHook";

export default function WorkspaceUsersPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const { data: profileData } = useTenantProfile();
  const tenantId = profileData?.data?.tenant_id || "";

  const [finalInput] = useDebounceHook(searchTerm);

  const { data: workspaceData, isLoading } = useWorkspaceUsers(
    tenantId,
    page,
    5,
    finalInput || undefined,
    roleFilter === "all" ? undefined : roleFilter,
  );

  const userList = useMemo(() => {
    const rawUsers = workspaceData?.data?.users;
    if (rawUsers && rawUsers.length > 0) {
      return rawUsers.map((u: WorkspaceUserInfo) => ({
        user_id: u.user_id,
        name: u.name,
        email: u.email,
        system_role: u.system_role as "root" | "manager",
        status: "active" as const,
        last_active: u.created_at
          ? new Date(u.created_at).toLocaleDateString()
          : "Recently",
      }));
    }
    return [];
  }, [workspaceData]);

  const totalCount = workspaceData?.data?.total_count ?? userList.length;

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 tracking-wide">
        <span>Settings & Team</span>
        <span>/</span>
        <span className="text-slate-800">Workspace Users</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Workspace Users
            </h1>
            
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Manage who has access to the Schedulux dashboard and their
            permissions.
          </p>
        </div>

        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="px-5 py-2.5 bg-slate-950 hover:bg-black text-white text-xs font-semibold rounded-full flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
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
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Role Capabilities
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Managers handle direct care scheduling and AI monitoring. Clinical
              Directors and Owners retain full control over autonomous
              parameters and financial tools.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="block text-xl font-extrabold text-slate-900 leading-tight">
                99.4%
              </span>
              <span className="text-[10px] font-semibold text-slate-400">
                Audit Compliance
              </span>
            </div>
            <div>
              <span className="block text-xl font-extrabold text-slate-900 leading-tight">
                2FA
              </span>
              <span className="text-[10px] font-semibold text-slate-400">
                Enforced Globally
              </span>
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
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Session Activity
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              All access modifications, AI prompt updates, and medical record
              access logs are timestamped and exportable for HIPAA compliance
              reporting.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">
              Last access log updated 8 mins ago
            </span>
           
          </div>
        </div>
      </div>

      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        tenantId={tenantId}
      />
    </div>
  );
}
