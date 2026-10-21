import { Loader2, Shield } from 'lucide-react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useSuperAdminProfile } from '../hooks/useSuperAdmin';

export function SuperAdminProtectedRoute() {
  const location = useLocation();
  const { data: profileData, isLoading, isError } = useSuperAdminProfile();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#07090f] flex flex-col items-center justify-center gap-4 text-slate-100">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-600 to-violet-600 flex items-center justify-center shadow-xl shadow-rose-600/30 animate-pulse">
          <Shield className="w-7 h-7 text-white" />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
          <span>Authenticating SuperAdmin Console...</span>
        </div>
      </div>
    );
  }

  if (isError || !profileData?.data) {
    return <Navigate to="/superadmin/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
