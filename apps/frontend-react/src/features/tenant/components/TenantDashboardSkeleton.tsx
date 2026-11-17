import {
  BookOpen,
  Bot,
  Calendar,
  Loader2,
  Package,
  Tag,
  Zap,
} from 'lucide-react';

export function TenantDashboardSkeleton() {
  return (
    <div
      className="flex flex-col gap-6 sm:gap-8 animate-pulse"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      {/* Live Sync Status Banner */}
      <div className="flex items-center justify-between bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-800">
              Synchronizing Dashboard Metrics...
            </h2>
            <p className="text-[11px] text-slate-400">
              Loading agent operational status, service counts, and scheduled appointments
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
          <span className="text-[11px] font-semibold text-indigo-600">Live Sync</span>
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Active Agent Card Skeleton */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Active Agent</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-400">
              <Bot className="w-4 h-4 opacity-50" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-6 w-3/4 bg-slate-200 rounded-lg" />
            <div className="flex items-center gap-2 mt-2">
              <div className="h-5 w-16 bg-emerald-50 border border-emerald-100 rounded-md" />
              <div className="h-4 w-20 bg-slate-100 rounded-md" />
            </div>
          </div>
        </div>

        {/* Agent Services Card Skeleton */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Agent Services</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-400">
              <Tag className="w-4 h-4 opacity-50" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-8 w-16 bg-slate-200 rounded-lg" />
            <div className="h-3.5 w-32 bg-slate-100 rounded-md" />
          </div>
        </div>

        {/* Resources & Capacity Card Skeleton */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Resources &amp; Capacity</span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-400">
              <Package className="w-4 h-4 opacity-50" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-8 w-16 bg-slate-200 rounded-lg" />
            <div className="h-3.5 w-36 bg-slate-100 rounded-md" />
          </div>
        </div>

        {/* Agent Appointments Card Skeleton */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Agent Appointments</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-400">
              <Calendar className="w-4 h-4 opacity-50" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-8 w-16 bg-slate-200 rounded-lg" />
            <div className="flex items-center gap-2 mt-2">
              <div className="h-5 w-20 bg-emerald-50 border border-emerald-100 rounded-md" />
              <div className="h-5 w-16 bg-slate-100 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary 2-Card Grid: Quota & Knowledge Base */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* Token Quota Card Skeleton */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-500 shrink-0">
              <Zap className="w-5 h-5 opacity-60" />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-slate-400 font-semibold">Weekly AI Token Quota</p>
              <div className="h-5 w-28 bg-slate-200 rounded-md" />
            </div>
          </div>
          <div className="w-full sm:w-32 space-y-1.5 pt-2 sm:pt-0">
            <div className="w-full bg-slate-100 rounded-full h-2" />
            <div className="h-3 w-12 bg-slate-100 rounded-md ml-auto" />
          </div>
        </div>

        {/* Knowledge Base Card Skeleton */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-indigo-500 shrink-0">
              <BookOpen className="w-5 h-5 opacity-60" />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-slate-400 font-semibold">Trained Knowledge Base</p>
              <div className="h-5 w-32 bg-slate-200 rounded-md" />
            </div>
          </div>
          <div className="h-4 w-14 bg-indigo-50 rounded-md" />
        </div>
      </div>

      {/* Quick Actions Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-4 h-4 rounded bg-slate-200" />
              <div className="h-3.5 w-24 bg-slate-200 rounded-md" />
            </div>
            <div className="w-3.5 h-3.5 rounded bg-slate-100" />
          </div>
        ))}
      </div>

      {/* Bottom Grid: Appointments Table & Services Card */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Appointments Table Skeleton */}
        <div className="xl:col-span-7 bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-bold text-slate-800">Recent Appointments</span>
            </div>
            <div className="h-3.5 w-20 bg-slate-100 rounded-md" />
          </div>
          <div className="p-4 sm:p-5 space-y-3.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0"
              >
                <div className="space-y-1.5">
                  <div className="h-3.5 w-32 bg-slate-200 rounded-md" />
                  <div className="h-3 w-24 bg-slate-100 rounded-md" />
                </div>
                <div className="h-3 w-28 bg-slate-100 rounded-md hidden sm:block" />
                <div className="h-5 w-20 bg-slate-100 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Services Offerings Skeleton */}
        <div className="xl:col-span-5 bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-bold text-slate-800">
                  Agent Services &amp; Offerings
                </span>
              </div>
              <div className="h-3.5 w-16 bg-slate-100 rounded-md" />
            </div>
            <div className="p-4 space-y-2.5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/60 flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 w-28 bg-slate-200 rounded-md" />
                    <div className="h-3 w-20 bg-slate-100 rounded-md" />
                  </div>
                  <div className="h-4 w-12 bg-emerald-50 rounded-md" />
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <div className="h-3.5 w-24 bg-slate-200 rounded-md" />
            <div className="h-7 w-24 bg-slate-200 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

