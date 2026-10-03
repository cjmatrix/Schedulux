import { Navigate, Outlet, useLocation } from "react-router";
import { Loader2, Calendar } from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";
import { useDashboardProfile } from "../../tenant/hooks/useAuth";

export function DashboardUserProtectedRoute() {
  const location = useLocation();
  const { user, isAuthenticated } = useAuthStore();
  const { data: profileData, isLoading, isError } = useDashboardProfile(!isAuthenticated);

  if (isAuthenticated && user) {
    return <Outlet />;
  }

  if (isLoading) {
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

  if (isError || !profileData?.data) {
    return <Navigate to="/dashboarduser/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
