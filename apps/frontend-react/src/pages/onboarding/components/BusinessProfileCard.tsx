import {
  Building2,
  Calendar,
  Check,
  ChevronDown,
  Globe,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Tag,
} from 'lucide-react';
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
  const blackoutDates = operatingHours?.blackout_dates || [];

  const contact = businessProfile?.contact || {};
  const phone = contact.public_phone || null;
  const email = contact.support_email || null;
  const escalationPhone = contact.escalation_phone || null;
  const address = businessProfile?.address || null;
  const vertical = businessProfile?.vertical || businessProfile?.industry || null;
  const locale = businessProfile?.locale || 'en-US';
  const terminology = businessProfile?.terminology || null;

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-6 shadow-2xs space-y-5 min-w-0">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 shrink-0 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900">Business Profile</h3>
            <p className="text-xs text-slate-500">
              Core identity anchored across conversational prompts &amp; AI receptionist
            </p>
          </div>
        </div>
        <span className="bg-slate-100 text-slate-700 font-bold text-[11px] px-3 py-1 rounded-full flex items-center gap-1.5 whitespace-nowrap shrink-0">
          <span
            className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-slate-900'}`}
          />
          {isLive ? 'Live Verified' : 'Draft Model'}
        </span>
      </div>

      {/* Row 1: Clinic Name & Timezone / Currency */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            CLINIC / BUSINESS NAME
          </label>
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-2.5 flex items-center justify-between text-xs font-bold text-slate-900 shadow-2xs">
            <span className="truncate">{clinicName}</span>
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 ml-2" />
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

      {/* Row 2: Contact & Physical Location (With Smart Empty Placeholders) */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          CONTACT &amp; PHYSICAL LOCATION
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Public Phone */}
          <div
            className={`rounded-2xl px-3.5 py-2.5 border text-xs flex items-center gap-2.5 transition ${
              phone
                ? 'bg-slate-50 border-slate-200/80 text-slate-900 font-semibold'
                : 'bg-slate-50/40 border-dashed border-slate-200 text-slate-400'
            }`}
          >
            <Phone
              className={`w-3.5 h-3.5 shrink-0 ${phone ? 'text-indigo-600' : 'text-slate-300'}`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Phone</p>
              <p className="truncate text-xs font-medium">
                {phone || <span className="italic font-normal">Not configured</span>}
              </p>
            </div>
          </div>

          {/* Support Email */}
          <div
            className={`rounded-2xl px-3.5 py-2.5 border text-xs flex items-center gap-2.5 transition ${
              email
                ? 'bg-slate-50 border-slate-200/80 text-slate-900 font-semibold'
                : 'bg-slate-50/40 border-dashed border-slate-200 text-slate-400'
            }`}
          >
            <Mail
              className={`w-3.5 h-3.5 shrink-0 ${email ? 'text-indigo-600' : 'text-slate-300'}`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Email</p>
              <p className="truncate text-xs font-medium">
                {email || <span className="italic font-normal">Not configured</span>}
              </p>
            </div>
          </div>

          {/* Physical Address */}
          <div
            className={`rounded-2xl px-3.5 py-2.5 border text-xs flex items-center gap-2.5 transition ${
              address
                ? 'bg-slate-50 border-slate-200/80 text-slate-900 font-semibold'
                : 'bg-slate-50/40 border-dashed border-slate-200 text-slate-400'
            }`}
            title={address || 'No physical address configured'}
          >
            <MapPin
              className={`w-3.5 h-3.5 shrink-0 ${address ? 'text-emerald-600' : 'text-slate-300'}`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                Address
              </p>
              <p className="truncate text-xs font-medium">
                {address || <span className="italic font-normal">Location unassigned</span>}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Industry Vertical, Locale & Terminology Badges */}
      <div className="p-3.5 bg-slate-50/80 border border-slate-200/70 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-slate-200 shadow-2xs font-medium text-slate-700">
            <Tag className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-[10px] text-slate-400 font-bold uppercase">Vertical:</span>
            <span className="capitalize">{vertical?.replace('_', ' ') || 'General Business'}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-slate-200 shadow-2xs font-medium text-slate-700">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] text-slate-400 font-bold uppercase">Locale:</span>
            <span>{locale}</span>
          </div>

          {terminology && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-slate-200 shadow-2xs font-medium text-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[10px] text-slate-400 font-bold uppercase">Customer:</span>
              <span>{terminology.customer_singular || 'Client'}</span>
            </div>
          )}
        </div>

        {escalationPhone && (
          <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full font-medium">
            Escalation: {escalationPhone}
          </span>
        )}
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
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                <span>{closedGroups.map((g) => g.label).join(', ')} Closed</span>
              </div>
            )}
          </div>

          {/* Weekly Day Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2 border-t border-slate-200/60">
            {days.map((day) => {
              const slots = operatingHours?.[day.key];
              const isOpen = Array.isArray(slots) && slots.length > 0 && slots[0]?.start;
              const startStr = slots?.[0]?.start?.slice(0, 5);
              const endStr = slots?.[0]?.end?.slice(0, 5);
              return (
                <div
                  key={day.key}
                  className={`text-center py-2 px-2 rounded-xl text-[10px] ${
                    isOpen
                      ? 'bg-white border border-slate-200 text-slate-800 font-bold shadow-2xs'
                      : 'bg-slate-100/70 text-slate-400 font-medium'
                  }`}
                >
                  <p className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                    {day.label}
                  </p>
                  <p className="mt-0.5 whitespace-nowrap">
                    {isOpen
                      ? endStr
                        ? `${startStr}–${endStr}`
                        : startStr || 'Open'
                      : 'Closed'}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Blackout / Holidays Strip */}
          {blackoutDates.length > 0 && (
            <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2 flex-wrap text-[11px]">
              <span className="font-bold text-slate-400 text-[10px] uppercase">
                Blackout Dates:
              </span>
              {blackoutDates.map((b, i) => (
                <span
                  key={i}
                  className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md font-semibold"
                >
                  {b.date} {b.reason ? `(${b.reason})` : ''}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
