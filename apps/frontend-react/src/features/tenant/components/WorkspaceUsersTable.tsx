import { useState } from 'react';
import { MoreVertical, Loader2 } from 'lucide-react';
import { Pagination } from '../../../components/Pagination';

export interface WorkspaceUser {
  user_id: string;
  name: string;
  email: string;
  system_role: 'root' | 'manager';
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
}

export function WorkspaceUsersTable({
  users,
  isLoading = false,
  pageSize = 5,
  totalCount: propTotalCount,
  currentPage: propCurrentPage,
  onPageChange,
  onUserAction,
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

 
  const displayUsers = users
  
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
                  const isOwner = user.system_role === 'root';

                  return (
                    <tr key={user.user_id} className="hover:bg-slate-50/60 transition-colors group">
                      {/* User Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {getInitials(user.name)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 leading-tight">{user.name}</span>
                            <span className="text-[11px] text-slate-400">{user.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {isOwner ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-700 border border-purple-200/60">
                            Owner
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700 border border-blue-200/60">
                            Manager
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              user.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                          />
                          <span className="font-medium capitalize text-slate-800">
                            {user.status === 'active' ? 'Active' : 'Pending'}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-slate-500 font-medium">
                        {user.last_active}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => onUserAction?.(user)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
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
