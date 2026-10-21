import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Server,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useSuperAdminProfile } from '../hooks/useSuperAdmin';

// ---- Mock data ----
const STATS = [
  { label: 'Total Tenants', value: '1,248', change: '+12%', icon: Building2, color: 'indigo' },
  { label: 'Active Users', value: '8,432', change: '+4.3%', icon: Users, color: 'violet' },
  {
    label: 'Monthly Revenue',
    value: '$48,920',
    change: '+18%',
    icon: CreditCard,
    color: 'emerald',
  },
  { label: 'System Health', value: '99.97%', change: 'Nominal', icon: Activity, color: 'rose' },
];

const RECENT_TENANTS = [
  {
    id: 'tnt_1',
    name: 'Apex Dental Clinic',
    email: 'owner@apexdental.com',
    tier: 'Pro',
    status: 'active',
    joined: 'Sep 28, 2025',
  },
  {
    id: 'tnt_2',
    name: 'Mikey Garrix Auto',
    email: 'mikey@garrix.com',
    tier: 'Starter',
    status: 'active',
    joined: 'Sep 27, 2025',
  },
  {
    id: 'tnt_3',
    name: 'Sunrise Spa & Wellness',
    email: 'hello@sunrisespa.co',
    tier: 'Pro',
    status: 'pending',
    joined: 'Sep 26, 2025',
  },
  {
    id: 'tnt_4',
    name: 'TechCore Solutions',
    email: 'admin@techcore.io',
    tier: 'Enterprise',
    status: 'active',
    joined: 'Sep 25, 2025',
  },
  {
    id: 'tnt_5',
    name: 'Blue Ridge Barbers',
    email: 'contact@blueridge.com',
    tier: 'Starter',
    status: 'suspended',
    joined: 'Sep 22, 2025',
  },
];

const SYSTEM_ALERTS = [
  { type: 'warn', message: 'Redis memory usage at 78% capacity', time: '12 min ago' },
  { type: 'ok', message: 'Scheduled maintenance completed successfully', time: '1h ago' },
  { type: 'warn', message: '3 email delivery failures in background worker', time: '2h ago' },
  { type: 'ok', message: 'MongoDB Atlas replica sync healthy', time: '3h ago' },
];

const TIER_COLOR: Record<string, string> = {
  Starter: 'bg-slate-700/60 text-slate-300',
  Pro: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
  Enterprise: 'bg-violet-500/20 text-violet-300 border border-violet-500/30',
};

const STATUS_COLOR: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
  pending: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
  suspended: 'bg-rose-500/15 text-rose-400 border border-rose-500/25',
};

const STAT_COLOR: Record<string, string> = {
  indigo: 'from-indigo-600 to-indigo-500 shadow-indigo-600/20',
  violet: 'from-violet-600 to-violet-500 shadow-violet-600/20',
  emerald: 'from-emerald-600 to-emerald-500 shadow-emerald-600/20',
  rose: 'from-rose-600 to-rose-500 shadow-rose-600/20',
};

export default function SuperAdminDashboard() {
  const { data: profileData, isLoading: profileLoading } = useSuperAdminProfile();

  const adminName = profileData?.data?.name ?? 'SuperAdmin';

  return (
    <div className="p-5 lg:p-7 space-y-6">
      {/* Welcome */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">
            {profileLoading ? (
              <span className="text-slate-500 text-base">Loading...</span>
            ) : (
              `Welcome back, ${adminName} 👋`
            )}
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Here's a full snapshot of the Schedulux platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 rounded-xl border border-slate-700/70 text-slate-400 text-xs font-medium hover:text-slate-200 hover:border-slate-600 transition-all flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5" />
            Export Report
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="bg-slate-900/60 border border-slate-800/70 rounded-2xl p-5 flex flex-col gap-4 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">{stat.label}</span>
              <div
                className={`w-9 h-9 rounded-xl bg-gradient-to-br ${STAT_COLOR[stat.color]} flex items-center justify-center shadow-lg flex-shrink-0`}
              >
                <stat.icon className="w-4.5 h-4.5 text-white w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-white leading-none">{stat.value}</p>
              <p className="text-xs text-emerald-400 mt-1">{stat.change} this month</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Recent Tenants Table */}
        <div className="xl:col-span-2 bg-slate-900/60 border border-slate-800/70 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              Recent Tenants
            </h3>
            <button className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
                  <th className="text-left px-5 py-3 bg-slate-900/40">Business</th>
                  <th className="text-left px-5 py-3 bg-slate-900/40 hidden sm:table-cell">Tier</th>
                  <th className="text-left px-5 py-3 bg-slate-900/40">Status</th>
                  <th className="text-left px-5 py-3 bg-slate-900/40 hidden md:table-cell">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {RECENT_TENANTS.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-white leading-none">{tenant.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{tenant.email}</p>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-medium ${TIER_COLOR[tenant.tier]}`}
                      >
                        {tenant.tier}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-medium capitalize ${STATUS_COLOR[tenant.status]}`}
                      >
                        {tenant.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-xs text-slate-500">{tenant.joined}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Alerts */}
        <div className="bg-slate-900/60 border border-slate-800/70 rounded-2xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              System Alerts
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25 font-semibold">
              2 warnings
            </span>
          </div>
          <div className="flex-1 divide-y divide-slate-800/50 overflow-y-auto">
            {SYSTEM_ALERTS.map((alert, i) => (
              <div
                key={i}
                className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {alert.type === 'ok' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-300 leading-relaxed">{alert.message}</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-slate-800/60">
            <button className="w-full text-xs text-slate-400 hover:text-slate-200 font-medium transition-colors py-1">
              View All System Logs →
            </button>
          </div>
        </div>
      </div>

      {/* Service Status */}
      <div className="bg-slate-900/60 border border-slate-800/70 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Server className="w-4 h-4 text-violet-400" />
          Service Status
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { name: 'API Gateway', status: 'Operational', port: '5000' },
            { name: 'Identity Service', status: 'Operational', port: '5001' },
            { name: 'Background Worker', status: 'Operational', port: 'RabbitMQ' },
            { name: 'Frontend App', status: 'Operational', port: '5173' },
          ].map((svc) => (
            <div
              key={svc.name}
              className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 flex flex-col gap-1"
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                <span className="text-xs font-semibold text-white truncate">{svc.name}</span>
              </div>
              <span className="text-[10px] text-slate-500">Port: {svc.port}</span>
              <span className="text-[11px] text-emerald-400 font-medium">{svc.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
