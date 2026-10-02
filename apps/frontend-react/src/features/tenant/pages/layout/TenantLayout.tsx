import { Outlet, useLocation, useNavigate } from "react-router";
import {
  Calendar,
  BookOpen,
  MessageSquare,
  Users,
  Package,
  Briefcase,
  Tag,
  Settings,
  CreditCard,
  Code2,
  Search,
  Bell,
  HelpCircle,
  ArrowLeft,
  LogOut,
  Loader2,
} from "lucide-react";
import { useAuthStore } from "../../../../store/useAuthStore";
import { useLogout } from "../../../../hooks/useAuth";

const ALL_NAV_ITEMS = [
  { icon: Calendar, label: "Calendar & Bookings", path: "/tenant/bookings" },
  { icon: BookOpen, label: "Knowledge Base", path: "/tenant/knowledge" },
  {
    icon: MessageSquare,
    label: "Live Conversations",
    path: "/tenant/conversations",
    badge: true,
  },
  { icon: Users, label: "Customers", path: "/tenant/customers" },
  { icon: Package, label: "Resources & Inventory", path: "/tenant/inventory" },
  { icon: Briefcase, label: "Workspace Users", path: "/tenant/users" },
  { icon: Tag, label: "Services & Pricing", path: "/tenant/services" },
  { icon: Settings, label: "Settings", path: "/tenant/settings" },
  { icon: CreditCard, label: "Billing", path: "/tenant/billing" },
  { icon: Code2, label: "Embed Widget", path: "/tenant/widget" },
];

export default function TenantLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout: authStoreLogout } = useAuthStore();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        authStoreLogout();
        navigate("/login");
      },
      onError: () => {
        authStoreLogout();
        navigate("/login");
      },
    });
  };

  let NAV_ITEMS = ALL_NAV_ITEMS;

  if (user?.system_role === "root") {
    NAV_ITEMS = ALL_NAV_ITEMS.filter((item) => item.path !== "/tenant/billing");
  } else if (user?.system_role === "manager") {
    NAV_ITEMS = ALL_NAV_ITEMS.filter(
      (item) =>
        ![
          "/tenant/knowledge",
          "/tenant/users",
          "/tenant/settings",
          "/tenant/billing",
          "/tenant/widget",
        ].includes(item.path),
    );
  }

  const currentBusinessName = user?.business_name || "Apex Dental Clinic";
  const currentUserFullName =
    user?.name || user?.contact_email?.split("@")[0] || "Workspace Member";
  const currentUserRole = user?.system_role || "owner";
  const userInitials = currentUserFullName.substring(0, 2).toUpperCase();

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans antialiased text-slate-800 overflow-hidden">
      <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5 mb-3 px-1">
              <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center font-bold text-sm shadow-sm">
                S
              </div>
              <span className="font-bold text-slate-900 tracking-tight text-base">
                Schedulux AI
              </span>
            </div>
          </div>

          <nav className="p-3 flex flex-col gap-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path === "/tenant/users" &&
                  (location.pathname === "/tenant" ||
                    location.pathname === "/tenant/"));
              const Icon = item.icon;

              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-slate-100 text-slate-900 font-semibold shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 ${isActive ? "text-slate-900" : "text-slate-400"}`}
                    />
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
          <button
            onClick={() => navigate("/")}
            className="w-full py-2 px-3 bg-black hover:bg-slate-900 text-white rounded-full text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Agent Studio</span>
          </button>

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
            <span className="text-slate-900 font-semibold">
              {currentBusinessName}
            </span>
            <span>/</span>
            <span>Service Operations</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search bookings, clients..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-100/70 border border-slate-200/60 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white transition-all"
              />
            </div>

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
