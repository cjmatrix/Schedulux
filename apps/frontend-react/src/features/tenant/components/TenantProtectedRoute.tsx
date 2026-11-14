import { Calendar, Loader2 } from 'lucide-react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuthStore } from '../../../store/useAuthStore';
import { useDashboardAuthStore } from '../../../store/useDashboardAuthStore';
import { useTenantProfile } from '../hooks/useAuth';
import { useDashboardProfile } from '../../dashboard-user/hooks/useDashboardAuth';

export function TenantProtectedRoute() {
  const location = useLocation();
  const { user: tenantUser, isAuthenticated: isTenantAuth } = useAuthStore();
  const { user: dashboardUser, isAuthenticated: isDashboardAuth } = useDashboardAuthStore();

  const isStoreAuthenticated =
    (isTenantAuth && Boolean(tenantUser)) || (isDashboardAuth && Boolean(dashboardUser));

  const shouldFetchProfiles = !isStoreAuthenticated;
  const { data: tenantProfile, isLoading: isTenantLoading } =
    useTenantProfile(shouldFetchProfiles);
  const { data: dashboardProfile, isLoading: isDashboardLoading } =
    useDashboardProfile(shouldFetchProfiles);

  if (isStoreAuthenticated) {
    return <Outlet />;
  }

  if (shouldFetchProfiles && (isTenantLoading || isDashboardLoading)) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center gap-4 text-slate-800">
        <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white shadow-lg animate-pulse">
          <Calendar className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <Loader2 className="w-4 h-4 animate-spin text-black" />
          <span>Verifying workspace session...</span>
        </div>
      </div>
    );
  }

  if (tenantProfile?.data || dashboardProfile?.data) {
    return <Outlet />;
  }

  return <Navigate to="/login" replace state={{ from: location }} />;
}
