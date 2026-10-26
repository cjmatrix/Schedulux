import {
  ArrowLeft,
  Bell,
  BookOpen,
  Bot,
  Briefcase,
  Calendar,
  ChevronDown,
  Code2,
  CreditCard,
  HelpCircle,
  Loader2,
  LogOut,
  MessageSquare,
  Package,
  Settings,
  Tag,
  Users,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router';
import { knowledgeApi } from '../../../../api/knowledgeApi';
import { useAuthStore } from '../../../../store/useAuthStore';
import { useLogout, useTenantProfile } from '../../hooks/useAuth';

const ALL_NAV_ITEMS = [
  { icon: Bot, label: 'AI Agents', path: '/tenant/agents' },
  { icon: Calendar, label: 'Calendar & Bookings', path: '/tenant/bookings' },
  { icon: BookOpen, label: 'Knowledge Base', path: '/tenant/knowledge' },
  {
    icon: MessageSquare,
    label: 'Live Conversations',
    path: '/tenant/conversations',
    badge: true,
  },
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

export default function TenantLayout({ isTenant = true }: TenantLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { agentId: routeAgentId } = useParams<{ agentId?: string }>();
  const { data: profileData } = useTenantProfile(isTenant);
  const logoutMutation = useLogout();
  const authUser = useAuthStore((state) => state.user);

  const urlAgentId =
    routeAgentId || location.pathname.match(/\/tenant\/agents\/([^/]+)/)?.[1] || null;

  const { data: agentsData } = useQuery({
    queryKey: ['tenant-agents-list'],
    queryFn: () => knowledgeApi.listTenantAgents(),
  });
  const agents = agentsData?.data || [];
  const currentAgent = agents.find((a) => a.agent_id === urlAgentId);
  const currentAgentId = urlAgentId || (agents[0]?.agent_id ?? null);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => navigate(isTenant ? '/login' : '/dashboarduser/login'),
      onError: () => navigate(isTenant ? '/login' : '/dashboarduser/login'),
    });
  };

  const userRole = authUser?.system_role;

  const NAV_ITEMS = ALL_NAV_ITEMS.filter((item) => {
    if (!userRole || userRole === 'owner') {
      return true;
    }

    if (userRole === 'root') {
      return item.path !== '/tenant/billing';
    }

    if (userRole === 'manager') {
      const hiddenForManager = [
        '/tenant/users',
        '/tenant/billing',
        '/tenant/widget',
        '/tenant/knowledge',
      ];
      return !hiddenForManager.includes(item.path);
    }

    return true;
  });

  const canAccessAgentStudio = isTenant && (!userRole || userRole === 'owner');

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
    authUser?.system_role === 'root'
      ? 'Root Admin'
      : authUser?.system_role === 'manager'
        ? 'Manager'
        : 'Tenant Owner';
  const userInitials = currentUserFullName.substring(0, 2).toUpperCase();

  const handleNavItemClick = (itemPath: string) => {
    if (currentAgentId) {
      if (itemPath === '/tenant/bookings') {
        navigate(`/tenant/agents/${currentAgentId}/bookings`);
        return;
      }
      if (itemPath === '/tenant/services') {
        navigate(`/tenant/agents/${currentAgentId}/services`);
        return;
      }
      if (itemPath === '/tenant/inventory') {
        navigate(`/tenant/agents/${currentAgentId}/resources`);
        return;
      }
    }
    navigate(itemPath);
  };

  const handleSwitchAgent = (newAgentId: string) => {
    if (location.pathname.includes('/bookings')) {
      navigate(`/tenant/agents/${newAgentId}/bookings`);
    } else if (location.pathname.includes('/services')) {
      navigate(`/tenant/agents/${newAgentId}/services`);
    } else if (location.pathname.includes('/resources') || location.pathname.includes('/inventory')) {
      navigate(`/tenant/agents/${newAgentId}/resources`);
    } else {
      navigate(`/tenant/agents/${newAgentId}/dashboard`);
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans antialiased text-slate-800 overflow-hidden">
      <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0">
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
            </div>

            {agents.length > 1 ? (
              <div className="relative">
                <select
                  value={currentAgentId || ''}
                  onChange={(e) => handleSwitchAgent(e.target.value)}
                  className="w-full appearance-none flex items-center justify-between px-3 py-2 pr-7 rounded-xl bg-slate-100/90 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition cursor-pointer border border-slate-200/60 focus:outline-none"
                >
                  {agents.map((a) => (
                    <option key={a.agent_id} value={a.agent_id}>
                      {a.name} ({a.agent_id.slice(-6)})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            ) : (
              <button
                onClick={() => navigate('/tenant/agents')}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100/90 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-semibold transition cursor-pointer border border-slate-200/60 w-full"
                title="Return to AI Agents Dashboard"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Bot className="w-4 h-4 text-slate-900 shrink-0" />
                  <span className="truncate">
                    {currentAgent?.name || (currentAgentId ? `Agent: ${currentAgentId}` : 'All Agents Hub')}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium shrink-0 ml-1">Switch</span>
              </button>
            )}
          </div>

          <nav className="p-3 flex flex-col gap-0.5">
            {currentAgentId && (
              <button
                onClick={() => navigate(`/tenant/agents/${currentAgentId}/dashboard`)}
                className={`w-full flex items-center justify-between px-3 py-2 mb-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  location.pathname === `/tenant/agents/${currentAgentId}/dashboard`
                    ? 'bg-slate-100 text-slate-900 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Bot
                    className={`w-4 h-4 ${location.pathname.endsWith('/dashboard') ? 'text-slate-900' : 'text-slate-400'}`}
                  />
                  <span>Agent Overview</span>
                </div>
              </button>
            )}

            {NAV_ITEMS.map((item) => {
              const isAgentsTab = item.path === '/tenant/agents';
              const isBookingsTab = item.path === '/tenant/bookings';
              const isServicesTab = item.path === '/tenant/services';
              const isInventoryTab = item.path === '/tenant/inventory';

              const isActive =
                (!isAgentsTab &&
                  !isBookingsTab &&
                  !isServicesTab &&
                  !isInventoryTab &&
                  location.pathname === item.path) ||
                (isAgentsTab && location.pathname === '/tenant/agents') ||
                (isBookingsTab && location.pathname.includes('/bookings')) ||
                (isServicesTab && location.pathname.includes('/services')) ||
                (isInventoryTab &&
                  (location.pathname.includes('/inventory') ||
                    location.pathname.includes('/resources'))) ||
                (item.path === '/tenant/users' &&
                  (location.pathname === '/tenant' || location.pathname === '/tenant/'));
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
          {canAccessAgentStudio && (
            <button
              onClick={() => navigate('/tenant/landingboard')}
              className="w-full py-2 px-3 bg-black hover:bg-slate-900 text-white rounded-full text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Agent Studio</span>
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
              disabled={logoutMutation.isPending}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              {logoutMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span className="text-slate-900 font-semibold">{currentBusinessName}</span>
            <span>/</span>
            <span>Service Operations</span>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-1.5 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors">
              <Bell className="w-4 h-4" />
            </button>

            <button className="p-1.5 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors">
              <HelpCircle className="w-4 h-4" />
            </button>

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
