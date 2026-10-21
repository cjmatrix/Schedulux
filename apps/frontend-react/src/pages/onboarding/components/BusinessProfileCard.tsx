import { Building2, Calendar, Check, ChevronDown } from 'lucide-react';
import React from 'react';
import type { BusinessProfileData, OperatingHoursData } from '../types';
import { getOperatingScheduleGroups } from '../utils';

interface BusinessProfileCardProps {
  clinicName: string;
  timezone: string;
  businessProfile?: BusinessProfileData;
  isLive: boolean;
  dailyHoursText: string;
  formattedHoursText: string;
  operatingHours?: OperatingHoursData;
}

export const BusinessProfileCard: React.FC<BusinessProfileCardProps> = ({
  clinicName,
  timezone,
  businessProfile,
  isLive,
  dailyHoursText,
  formattedHoursText: _formattedHoursText,
  operatingHours,
}) => {
  const days = [
    { key: 'monday', label: 'Mon' },
    { key: 'tuesday', label: 'Tue' },
    { key: 'wednesday', label: 'Wed' },
    { key: 'thursday', label: 'Thu' },
    { key: 'friday', label: 'Fri' },
    { key: 'saturday', label: 'Sat' },
    { key: 'sunday', label: 'Sun' },
  ];

  const scheduleGroups = getOperatingScheduleGroups(operatingHours);
  const openGroups = scheduleGroups.filter((g) => g.isOpen);
  const closedGroups = scheduleGroups.filter((g) => !g.isOpen);

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Business Profile</h3>
            <p className="text-xs text-slate-500">
              Core identity anchored across conversational prompts
            </p>
          </div>
        </div>
        <span className="bg-slate-100 text-slate-700 font-bold text-[11px] px-3 py-1 rounded-full flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-slate-900'}`}
          ></span>
          {isLive ? 'Live Verified' : 'Draft Model'}
        </span>
      </div>

      {/* Clinic Name & Timezone 2-Col Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            CLINIC / BUSINESS NAME
          </label>
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-2.5 flex items-center justify-between text-xs font-bold text-slate-900 shadow-2xs">
            <span className="truncate">{clinicName}</span>
            <Check className="w-4 h-4 text-slate-600 flex-shrink-0 ml-2" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            TIMEZONE &amp; CURRENCY
          </label>
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-2.5 flex items-center justify-between text-xs font-bold text-slate-900 shadow-2xs">
            <span className="truncate">
              {timezone ? (
                `${timezone} • ${businessProfile?.currency || 'USD'}`
              ) : (
                <span className="text-amber-600 font-medium">⚠️ Timezone not set</span>
              )}
            </span>
            <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" />
          </div>
        </div>
      </div>

      {/* Operating Hours Block */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            OPERATING SCHEDULE
          </label>
          <span className="text-[11px] font-semibold text-slate-500">{dailyHoursText}</span>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-2xs">
          {/* Dynamic Schedule Shifts */}
          <div className="space-y-2">
            {openGroups.length === 0 ? (
              <div className="flex items-center gap-2.5 text-xs text-slate-500 font-medium py-1">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>No operating hours configured</span>
              </div>
            ) : (
              openGroups.map((group, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Calendar className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-bold text-slate-900">{group.label}:</span>
                      <span className="font-semibold text-slate-700">{group.timeText}</span>
                    </div>
                  </div>
                  {group.dailyHoursText && (
                    <span className="text-[11px] font-medium text-slate-600 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full shadow-2xs whitespace-nowrap">
                      {group.dailyHoursText}
                    </span>
                  )}
                </div>
              ))
            )}

            {closedGroups.length > 0 && openGroups.length > 0 && (
              <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                <span>{closedGroups.map((g) => g.label).join(', ')} Closed</span>
              </div>
            )}
          </div>

          {/* Weekly Day Pills */}
          <div className="grid grid-cols-7 gap-1.5 pt-2 border-t border-slate-200/60">
            {days.map((day) => {
              const slots = operatingHours?.[day.key];
              const isOpen = Array.isArray(slots) && slots.length > 0 && slots[0]?.start;
              return (
                <div
                  key={day.key}
                  className={`text-center py-1.5 px-1 rounded-xl text-[10px] ${
                    isOpen
                      ? 'bg-white border border-slate-200 text-slate-800 font-bold shadow-2xs'
                      : 'bg-slate-100/70 text-slate-400 font-medium'
                  }`}
                >
                  <p className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                    {day.label}
                  </p>
                  <p className="truncate mt-0.5">
                    {isOpen ? (slots?.[0]?.start?.slice(0, 5) ?? 'Open') : 'Closed'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
