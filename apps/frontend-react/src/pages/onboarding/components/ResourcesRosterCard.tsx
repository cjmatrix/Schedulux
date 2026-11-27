import { Calendar, Check, ChevronDown, ChevronRight, Info, Users } from 'lucide-react';
import React, { useState } from 'react';
import type { OnboardingResourceItem } from '../types';

interface ResourcesRosterCardProps {
  resourcesList: OnboardingResourceItem[];
}

export const ResourcesRosterCard: React.FC<ResourcesRosterCardProps> = ({ resourcesList }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const daysList = [
    { key: 'monday', label: 'Mon' },
    { key: 'tuesday', label: 'Tue' },
    { key: 'wednesday', label: 'Wed' },
    { key: 'thursday', label: 'Thu' },
    { key: 'friday', label: 'Fri' },
    { key: 'saturday', label: 'Sat' },
    { key: 'sunday', label: 'Sun' },
  ];

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-6 shadow-2xs space-y-4 min-w-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 shrink-0 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Practitioners &amp; Resources Roster
              </h3>
              <span className="bg-slate-100 text-slate-700 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">
                {resourcesList.length} {resourcesList.length === 1 ? 'Resource' : 'Resources'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Clinical staff providers, treatment chairs, rooms, and active dispatch status
            </p>
          </div>
        </div>
      </div>

      {/* Table of Resources */}
      <div className="border border-slate-100 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-3 px-4">PROVIDER / ASSET</th>
              <th className="py-3 px-4">TYPE &amp; CATEGORY</th>
              <th className="py-3 px-4">ASSIGNED SERVICES</th>
              <th className="py-3 px-4">DISPATCH STATUS</th>
              <th className="py-3 px-4 text-right">AI BOOKING</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {resourcesList.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                  No practitioners or resources configured yet. Add your staff members or operatory
                  rooms in the chat.
                </td>
              </tr>
            ) : (
              resourcesList.map((res) => {
                const resKey = res.resource_id || String(res.idx);
                const isExpanded = expandedId === resKey;
                const customShifts = (res as any).custom_shift_overrides;
                const hasCustomShifts =
                  customShifts &&
                  typeof customShifts === 'object' &&
                  Object.keys(customShifts).length > 0;

                return (
                  <React.Fragment key={resKey}>
                    <tr
                      onClick={() => toggleExpand(resKey)}
                      className={`hover:bg-slate-50/80 transition cursor-pointer ${
                        isExpanded ? 'bg-slate-50/60' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="text-slate-400 hover:text-slate-600 transition"
                            aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 relative shadow-2xs">
                              <span>{res.initials}</span>
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                                  res.dispatch_status === 'active'
                                    ? 'bg-emerald-500'
                                    : res.dispatch_status === 'on_leave'
                                      ? 'bg-amber-500'
                                      : 'bg-slate-400'
                                }`}
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 text-xs truncate">
                                {res.name}
                              </p>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {res.title ||
                                    res.category ||
                                    res.resource_type ||
                                    'Staff Provider'}
                                </span>
                                {res.resource_id && (
                                  <span className="text-[9px] font-mono text-slate-400">
                                    • {res.resource_id}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="bg-slate-100 text-slate-700 font-extrabold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md inline-block">
                            {res.resource_type || 'staff'}
                          </span>
                          <p className="text-[10px] text-slate-500 font-medium">
                            {res.category || 'Clinical'}
                          </p>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {res.handledServices.length > 0 ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {res.handledServices.map((srv) => (
                              <span
                                key={srv.service_id}
                                className="bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
                              >
                                {srv.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">All services</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 font-bold text-[11px] px-2.5 py-0.5 rounded-full border ${
                            res.dispatch_status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                              : res.dispatch_status === 'on_leave'
                                ? 'bg-amber-50 text-amber-700 border-amber-200/80'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              res.dispatch_status === 'active'
                                ? 'bg-emerald-500'
                                : res.dispatch_status === 'on_leave'
                                  ? 'bg-amber-500'
                                  : 'bg-slate-400'
                            }`}
                          />
                          <span className="capitalize">{res.dispatch_status || 'active'}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {res.is_bookable !== false ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-900">
                            <Check className="w-3.5 h-3.5 text-slate-600" />
                            <span>Bookable</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">Internal</span>
                        )}
                      </td>
                    </tr>

                    {/* Expandable Details Row */}
                    {isExpanded && (
                      <tr className="bg-slate-50/90 border-b border-slate-100 text-xs">
                        <td colSpan={5} className="p-4 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                            {/* Detailed Description */}
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                <Info className="w-3 h-3 text-slate-400" />
                                Provider Bio &amp; Qualifications
                              </span>
                              <p className="text-xs text-slate-700 leading-relaxed">
                                {res.description || (
                                  <span className="text-slate-400 italic font-normal">
                                    No detailed bio provided. Ask the AI assistant to add
                                    practitioner details.
                                  </span>
                                )}
                              </p>
                            </div>

                            {/* Working Shifts & Schedule Overrides */}
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                Working Shift Overrides
                              </span>
                              {hasCustomShifts ? (
                                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 pt-1">
                                  {daysList.map((d) => {
                                    const shifts = customShifts[d.key];
                                    const hasShift =
                                      Array.isArray(shifts) &&
                                      shifts.length > 0 &&
                                      shifts[0]?.start;
                                    return (
                                      <div
                                        key={d.key}
                                        className={`text-center py-1.5 px-1 rounded-lg text-[10px] border ${
                                          hasShift
                                            ? 'bg-indigo-50/60 border-indigo-200 text-indigo-900 font-semibold'
                                            : 'bg-slate-50 border-slate-200/60 text-slate-400'
                                        }`}
                                      >
                                        <p className="font-bold uppercase text-[8px]">{d.label}</p>
                                        <p className="mt-0.5 whitespace-nowrap">
                                          {hasShift ? `${shifts[0].start?.slice(0, 5)}` : 'Off'}
                                        </p>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-500 italic">
                                  Follows standard clinic operating schedule (no custom shift
                                  overrides).
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs pt-1">
        <span className="text-slate-400 font-medium">
          Showing {resourcesList.length} providers with real-time slot conflict locking
        </span>
        <span className="text-[11px] text-slate-400 italic">
          Click any row to inspect bio &amp; custom shift schedules
        </span>
      </div>
    </div>
  );
};
