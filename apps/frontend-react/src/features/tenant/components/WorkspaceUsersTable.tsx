import { Ban, CheckCircle2, Loader2, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import { Pagination } from '../../../components/Pagination';

export interface WorkspaceUser {
  user_id: string;
  name: string;
  email: string;
  system_role: 'manager' | 'owner';
  agent_id?: string;
  agent_ids?: string[];
  status: string;
  last_active: string;
}

export interface WorkspaceUsersTableProps {
  users: WorkspaceUser[];
  isLoading?: boolean;
  pageSize?: number;
  totalCount?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onUserAction?: (user: WorkspaceUser) => void;
  onToggleSuspend?: (user: WorkspaceUser) => void;
  isSuspending?: boolean;
  suspendingUserId?: string | null;
}

export function WorkspaceUsersTable({
  users,
  isLoading = false,
  pageSize = 5,
  totalCount: propTotalCount,
  currentPage: propCurrentPage,
  onPageChange,
  onUserAction,
  onToggleSuspend,
  isSuspending = false,
  suspendingUserId = null,
}: WorkspaceUsersTableProps) {
  const [internalPage, setInternalPage] = useState(1);

  const activePage = propCurrentPage ?? internalPage;
  const handlePageChange = onPageChange ?? setInternalPage;

  const totalCount = propTotalCount ?? users.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const validPage = Math.min(activePage, totalPages);
  if (validPage !== activePage && validPage > 0 && !propCurrentPage) {
    setInternalPage(validPage);
  }

  const displayUsers = users;

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-slate-700" />
          <span className="text-xs font-medium">Loading workspace users...</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                <th className="px-6 py-3.5">USER</th>
                <th className="px-6 py-3.5">SYSTEM ROLE</th>
                <th className="px-6 py-3.5">STATUS</th>
                <th className="px-6 py-3.5">LAST ACTIVE</th>
                <th className="px-6 py-3.5 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {displayUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                    No workspace users found.
                  </td>
                </tr>
              ) : (
                displayUsers.map((user) => {
                  const isOwner = user.system_role === 'owner';

                  return (
                    <tr key={user.user_id} className="hover:bg-slate-50/60 transition-colors group">
                      {/* User Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {getInitials(user.name)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 leading-tight">
                              {user.name}
                            </span>
                            <span className="text-[11px] text-slate-400">{user.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isOwner ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-700 border border-purple-200/60">
                              Owner
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700 border border-blue-200/60">
                              Manager
                            </span>
                          )}
                          {user.agent_ids && user.agent_ids.length > 1 && (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200"
                              title={`Assigned to ${user.agent_ids.length} agents`}
                            >
                              {user.agent_ids.length} agents
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {user.status === 'suspended' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-slate-500 font-medium">{user.last_active}</td>

                      <td className="px-6 py-4 text-right">
                        {isOwner ? (
                          <span className="text-[11px] font-medium text-slate-400 italic">
                            Protected
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onToggleSuspend?.(user)}
                              disabled={isSuspending && suspendingUserId === user.user_id}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed ${
                                user.status === 'suspended'
                                  ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80'
                                  : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80'
                              }`}
                              title={
                                user.status === 'suspended'
                                  ? 'Reactivate workspace user'
                                  : 'Suspend workspace user'
                              }
                            >
                              {isSuspending && suspendingUserId === user.user_id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : user.status === 'suspended' ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              ) : (
                                <Ban className="w-3.5 h-3.5" />
                              )}
                              <span>{user.status === 'suspended' ? 'Unsuspend' : 'Suspend'}</span>
                            </button>
                            {onUserAction && (
                              <button
                                onClick={() => onUserAction(user)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        currentPage={validPage}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
