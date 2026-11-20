import {
  BookOpen,
  Bot,
  Briefcase,
  Calendar,
  ChevronDown,
  Code2,
  CreditCard,
  LayoutDashboard,
  Loader2,
  LogOut,
  type LucideIcon,
  Menu,
  Package,
  Plus,
  Settings,
  Tag,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { useCurrentUser } from '../../../../hooks/useCurrentUser';
import { useDashboardAuthStore } from '../../../../store/useDashboardAuthStore';
import { useDashboardLogout } from '../../../dashboard-user/hooks/useDashboardAuth';
import { useLogout, useTenantProfile } from '../../hooks/useAuth';
import { useTenantAgents } from '../../hooks/useKnowledgeDocuments';

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
  badge?: boolean;
}

const ALL_NAV_ITEMS: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/tenant/dashboard' },
  { icon: Calendar, label: 'Calendar & Bookings', path: '/tenant/bookings' },
  { icon: BookOpen, label: 'Knowledge Base', path: '/tenant/knowledge' },
  { icon: Users, label: 'Customers', path: '/tenant/customers' },
  { icon: Package, label: 'Resources & Inventory', path: '/tenant/inventory' },
  { icon: Briefcase, label: 'Workspace Users', path: '/tenant/users' },
  { icon: Tag, label: 'Services & Pricing', path: '/tenant/services' },
  { icon: Settings, label: 'Settings', path: '/tenant/settings' },
  { icon: CreditCard, label: 'Billing', path: '/tenant/billing' },
  { icon: Code2, label: 'Embed Widget', path: '/tenant/widget' },
];

interface TenantLayoutProps {
  isTenant?: boolean;
}

export default function TenantLayout(_props: TenantLayoutProps = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { agentId: routeAgentId } = useParams<{ agentId?: string }>();
  const { user: authUser, isOwner, isManager } = useCurrentUser();

  const { data: profileData } = useTenantProfile(isOwner);
  const tenantLogoutMutation = useLogout();
  const dashboardLogoutMutation = useDashboardLogout();
  const isLoggingOut = isOwner ? tenantLogoutMutation.isPending : dashboardLogoutMutation.isPending;

  const [searchParams] = useSearchParams();
  const queryAgentId = searchParams.get('agent_id');
  const urlAgentId =
    routeAgentId ||
    location.pathname.match(/\/tenant\/agents\/([^/]+)/)?.[1] ||
    queryAgentId ||
    null;

  const userRole = authUser?.system_role;
  const { data: agents = [] } = useTenantAgents();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const savedAgentId =
    typeof window !== 'undefined' ? localStorage.getItem('schedulux_active_agent_id') : null;
  const isSavedAgentValid = savedAgentId && agents.some((a) => a.agent_id === savedAgentId);

  const resolvedAgentId =
    urlAgentId || (isSavedAgentValid ? savedAgentId : null) || (agents[0]?.agent_id ?? null);

  const currentAgentId =
    userRole === 'manager' && authUser?.agent_id ? authUser.agent_id : resolvedAgentId;

  useEffect(() => {
    if (currentAgentId) {
      localStorage.setItem('schedulux_active_agent_id', currentAgentId);
    }
  }, [currentAgentId]);

  const currentAgent = agents.find((a) => a.agent_id === currentAgentId);

  const handleLogout = () => {
    if (isOwner) {
      tenantLogoutMutation.mutate(undefined, {
        onSuccess: () => navigate('/login'),
        onError: () => navigate('/login'),
      });
    } else {
      dashboardLogoutMutation.mutate(undefined, {
        onSuccess: () => navigate('/dashboarduser/login'),
        onError: () => navigate('/dashboarduser/login'),
      });
    }
  };

  const NAV_ITEMS = ALL_NAV_ITEMS.filter((item) => {
    if (!userRole || userRole === 'owner') {
      return true;
    }

    if (userRole === 'manager') {
      const allowedForManager = [
        '/tenant/bookings',
        '/tenant/services',
        '/tenant/inventory',
        '/tenant/customers',
      ];
      return allowedForManager.includes(item.path);
    }

    return true;
  });

  const canAccessAgentDashboard = isOwner;

  const currentTenant = profileData?.data;
  const currentBusinessName =
    currentTenant?.business_name || authUser?.business_name || 'My Workspace';
  const currentUserFullName =
    authUser?.name ||
    authUser?.email?.split('@')[0] ||
    currentTenant?.business_name ||
    currentTenant?.contact_email?.split('@')[0] ||
    'Workspace Member';
  const currentUserRole =
    authUser?.system_role === 'manager' ? 'Operations Manager' : 'Tenant Owner';
  const userInitials = currentUserFullName.substring(0, 2).toUpperCase();

  const handleNavItemClick = (itemPath: string) => {
    setMobileMenuOpen(false);

    if (currentAgentId) {
      if (itemPath === '/tenant/dashboard') {
        navigate(`/tenant/agents/${currentAgentId}/dashboard?agent_id=${currentAgentId}`);
        return;
      }
      if (itemPath === '/tenant/bookings') {
        navigate(`/tenant/agents/${currentAgentId}/bookings?agent_id=${currentAgentId}`);
        return;
      }
      if (itemPath === '/tenant/services') {
        navigate(`/tenant/agents/${currentAgentId}/services?agent_id=${currentAgentId}`);
        return;
      }
      if (itemPath === '/tenant/customers') {
        navigate(`/tenant/agents/${currentAgentId}/customers?agent_id=${currentAgentId}`);
        return;
      }
      if (itemPath === '/tenant/inventory') {
        navigate(`/tenant/agents/${currentAgentId}/resources?agent_id=${currentAgentId}`);
        return;
      }
      if (itemPath === '/tenant/knowledge') {
        navigate(`/tenant/agents/${currentAgentId}/knowledge?agent_id=${currentAgentId}`);
        return;
      }
      if (itemPath === '/tenant/settings') {
        navigate(`/tenant/agents/${currentAgentId}/settings?agent_id=${currentAgentId}`);
        return;
      }
      if (itemPath === '/tenant/widget') {
        navigate(`/tenant/agents/${currentAgentId}/widget?agent_id=${currentAgentId}`);
        return;
      }
      if (itemPath === '/tenant/billing') {
        navigate(`/tenant/agents/${currentAgentId}/billing?agent_id=${currentAgentId}`);
        return;
      }
      if (itemPath === '/tenant/users') {
        navigate(`/tenant/agents/${currentAgentId}/users?agent_id=${currentAgentId}`);
        return;
      }
    }
    navigate(itemPath);
  };

  const handleSwitchAgent = (newAgentId: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('schedulux_active_agent_id', newAgentId);
    }
    if (isManager) {
      useDashboardAuthStore.getState().setActiveAgentId(newAgentId);
    }

    if (location.pathname.includes('/bookings')) {
      navigate(`/tenant/agents/${newAgentId}/bookings?agent_id=${newAgentId}`);
    } else if (location.pathname.includes('/services')) {
      navigate(`/tenant/agents/${newAgentId}/services?agent_id=${newAgentId}`);
    } else if (location.pathname.includes('/customers')) {
      navigate(`/tenant/agents/${newAgentId}/customers?agent_id=${newAgentId}`);
    } else if (
      location.pathname.includes('/resources') ||
      location.pathname.includes('/inventory')
    ) {
      navigate(`/tenant/agents/${newAgentId}/resources?agent_id=${newAgentId}`);
    } else if (location.pathname.includes('/knowledge')) {
      navigate(`/tenant/agents/${newAgentId}/knowledge?agent_id=${newAgentId}`);
    } else if (location.pathname.includes('/settings')) {
      navigate(`/tenant/agents/${newAgentId}/settings?agent_id=${newAgentId}`);
    } else if (location.pathname.includes('/widget')) {
      navigate(`/tenant/agents/${newAgentId}/widget?agent_id=${newAgentId}`);
    } else if (location.pathname.includes('/billing')) {
      navigate(`/tenant/agents/${newAgentId}/billing?agent_id=${newAgentId}`);
    } else if (location.pathname.includes('/users')) {
      navigate(`/tenant/agents/${newAgentId}/users?agent_id=${newAgentId}`);
    } else {
      navigate(
        isManager
          ? `/tenant/agents/${newAgentId}/bookings?agent_id=${newAgentId}`
          : `/tenant/agents/${newAgentId}/dashboard?agent_id=${newAgentId}`,
      );
    }
  };

  const renderSidebarContent = (isMobile = false) => (
    <div className="flex flex-col justify-between h-full">
      <div>
        <div className="p-4 border-b border-slate-100 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center font-bold text-sm shadow-sm">
                S
              </div>
              <span className="font-bold text-slate-900 tracking-tight text-base">
                Schedulux AI
              </span>
            </div>
            {isMobile && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                aria-label="Close navigation"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {userRole === 'manager' ? (
            authUser?.agent_ids && authUser.agent_ids.length > 1 ? (
              <div className="relative">
                <select
                  value={currentAgentId || ''}
                  onChange={(e) => {
                    handleSwitchAgent(e.target.value);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full appearance-none flex items-center justify-between px-3 py-2 pr-7 rounded-xl bg-slate-100/90 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition cursor-pointer border border-slate-200/60 focus:outline-none"
                >
                  {agents
                    .filter((a) => authUser.agent_ids?.includes(a.agent_id))
                    .map((a) => (
                      <option key={a.agent_id} value={a.agent_id}>
                        {a.name} ({a.status === 'created' ? 'Live' : 'Draft'})
                      </option>
                    ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200/60">
                <Bot className="w-4 h-4 text-slate-900 shrink-0" />
                <span className="truncate">
                  {currentAgent?.name ||
                    (currentAgentId ? `Agent: ${currentAgentId.slice(-6)}` : 'Assigned Agent')}
                </span>
              </div>
            )
          ) : agents.length > 0 ? (
            <div className="relative">
              <select
                value={currentAgentId || agents[0]?.agent_id || ''}
                onChange={(e) => {
                  if (e.target.value === '__new_agent__') {
                    setMobileMenuOpen(false);
                    navigate('/tenant/landingboard');
                  } else {
                    handleSwitchAgent(e.target.value);
                    setMobileMenuOpen(false);
                  }
                }}
                className="w-full appearance-none flex items-center justify-between px-3 py-2 pr-7 rounded-xl bg-slate-100/90 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition cursor-pointer border border-slate-200/60 focus:outline-none"
              >
                {agents.map((a) => (
                  <option key={a.agent_id} value={a.agent_id}>
                    {a.name} ({a.status === 'created' ? 'Live' : 'Draft'})
                  </option>
                ))}
                <option value="__new_agent__">+ Create New Agent</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          ) : (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/tenant/landingboard');
              }}
              className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100/90 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-semibold transition cursor-pointer border border-slate-200/60 w-full"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Bot className="w-4 h-4 text-slate-900 shrink-0" />
                <span className="truncate">Create First Agent</span>
              </div>
              <Plus className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-1" />
            </button>
          )}
        </div>

        <nav className="p-3 flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const isDashboardTab = item.path === '/tenant/dashboard';
            const isBookingsTab = item.path === '/tenant/bookings';
            const isServicesTab = item.path === '/tenant/services';
            const isCustomersTab = item.path === '/tenant/customers';
            const isInventoryTab = item.path === '/tenant/inventory';
            const isKnowledgeTab = item.path === '/tenant/knowledge';
            const isSettingsTab = item.path === '/tenant/settings';
            const isBillingTab = item.path === '/tenant/billing';
            const isUsersTab = item.path === '/tenant/users';
            const isWidgetTab = item.path === '/tenant/widget';

            const isActive =
              (isDashboardTab &&
                (location.pathname.endsWith('/dashboard') ||
                  location.pathname === '/tenant' ||
                  location.pathname === '/tenant/')) ||
              (isBookingsTab && location.pathname.includes('/bookings')) ||
              (isServicesTab && location.pathname.includes('/services')) ||
              (isCustomersTab && location.pathname.includes('/customers')) ||
              (isInventoryTab &&
                (location.pathname.includes('/inventory') ||
                  location.pathname.includes('/resources'))) ||
              (isKnowledgeTab && location.pathname.includes('/knowledge')) ||
              (isSettingsTab && location.pathname.includes('/settings')) ||
              (isBillingTab && location.pathname.includes('/billing')) ||
              (isUsersTab && location.pathname.includes('/users')) ||
              (isWidgetTab && location.pathname.includes('/widget'));
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => handleNavItemClick(item.path)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-3 border-t border-slate-100 flex flex-col gap-2">
        {canAccessAgentDashboard && (
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              navigate('/tenant/agents');
            }}
            className="w-full py-2 px-3 bg-black hover:bg-slate-900 text-white rounded-full text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Agent Dashboard</span>
          </button>
        )}

        <div className="flex items-center justify-between px-2 py-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {userInitials}
            </div>
            <div className="flex flex-col text-left min-w-0">
              <span className="text-xs font-bold text-slate-900 leading-tight truncate">
                {currentUserFullName}
              </span>
              <span className="text-[10px] text-slate-500 capitalize truncate">
                {currentUserRole}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            {isLoggingOut ? (
              <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans antialiased text-slate-800 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200/80 flex-col justify-between shrink-0 h-full">
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer Aside */}
      <aside
        className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white z-50 flex flex-col justify-between shadow-2xl transition-transform duration-300 md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {renderSidebarContent(true)}
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 min-w-0 truncate">
              <span className="text-slate-900 font-semibold truncate">{currentBusinessName}</span>
              <span className="hidden sm:inline">/</span>
              <span className="hidden sm:inline">Service Operations</span>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center cursor-pointer shadow-2xs">
              {userInitials}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
