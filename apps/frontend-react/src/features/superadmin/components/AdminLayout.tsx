import { useState } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router';
import {
  Shield,
  LayoutDashboard,
  Building2,
  Settings,
  LogOut,
  Bell,
  ChevronRight,
  Loader2,
  Menu,
  X,
  Activity,
} from 'lucide-react';
import { useSuperAdminProfile, useSuperAdminLogout } from '../hooks/useSuperAdmin'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/superadmin/dashboard' },
  { icon: Building2, label: 'Tenants', path: '/superadmin/tenants' },
  { icon: Activity, label: 'System Health', path: '/superadmin/system-health' },
  { icon: Settings, label: 'Global Settings', path: '/superadmin/settings' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: profileData } = useSuperAdminProfile();
  const logoutMutation = useSuperAdminLogout();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => navigate('/superadmin/login'),
      onError: () => navigate('/superadmin/login'),
    });
  };

  const adminName = profileData?.data?.name ?? 'SuperAdmin';
  const adminEmail = profileData?.data?.email ?? '';

  return (
    <div className="min-h-screen bg-[#07090f] text-slate-100 flex font-sans">
      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-[#0d1117] border-r border-slate-800/70 flex flex-col
          transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800/70">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-600 to-violet-600 flex items-center justify-center shadow-lg shadow-rose-600/20 flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white leading-none">Schedulux</p>
            <p className="text-[10px] text-rose-400 font-semibold tracking-widest uppercase mt-0.5">SuperAdmin</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden text-slate-500 hover:text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <button
                key={item.label}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-rose-600/15 text-rose-300 border border-rose-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
                {isActive && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
              </button>
            );
          })}
        </nav>

        {/* Admin Profile & Logout */}
        <div className="p-3 border-t border-slate-800/70 space-y-2">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-800/40">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {adminName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{adminName}</p>
              <p className="text-[10px] text-slate-500 truncate">{adminEmail}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            {logoutMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LogOut className="w-3.5 h-3.5" />
            )}
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top bar */}
        <header className="flex-shrink-0 z-30 flex items-center justify-between px-5 py-3.5 bg-[#07090f]/90 backdrop-blur-xl border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-500 hover:text-slate-300 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-white">Platform Overview</h1>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · All systems operational
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            
            <button className="relative p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
            </button>
          </div>
        </header>

        {/* Nested Content Routes */}
        <main className="flex-1 overflow-auto bg-[#07090f]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
