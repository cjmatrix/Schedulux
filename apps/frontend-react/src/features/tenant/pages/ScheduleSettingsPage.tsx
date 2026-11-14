import {
  AlertCircle,
  Calendar,
  Clock,
  Globe,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Save,
  Shield,
  Sliders,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import type {
  BlackoutDate,
  OperatingHours,
  SchedulingEngineConfig,
  TimeInterval,
  VerificationPolicyConfig,
} from '../api/scheduleApi';
import { useTenantAgents } from '../hooks/useKnowledgeDocuments';
import { useTenantSchedule, useUpdateTenantSchedule } from '../hooks/useTenantSchedule';

const DAYS_OF_WEEK: Array<keyof OperatingHours> = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
];

const COMMON_CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'SGD', 'AED'];

export default function ScheduleSettingsPage() {
  const { agentId: routeAgentId } = useParams<{ agentId?: string }>();
  const [searchParams] = useSearchParams();
  const queryAgentId = searchParams.get('agent_id');
  const { data: agents = [], isLoading: isLoadingAgents } = useTenantAgents();

  const effectiveAgentId = routeAgentId || queryAgentId || agents[0]?.agent_id || '';
  const currentAgent = agents.find((a) => a.agent_id === effectiveAgentId);

  const {
    data: scheduleResponse,
    isLoading: isLoadingSchedule,
    isRefetching,
    refetch,
    isError,
    error,
  } = useTenantSchedule(effectiveAgentId);

  const updateMutation = useUpdateTenantSchedule();

  // Form State
  const [timezone, setTimezone] = useState<string>('UTC');
  const [currency, setCurrency] = useState<string>('USD');
  const [operatingHours, setOperatingHours] = useState<OperatingHours>({
    monday: [{ start: '09:00', end: '17:00' }],
    tuesday: [{ start: '09:00', end: '17:00' }],
    wednesday: [{ start: '09:00', end: '17:00' }],
    thursday: [{ start: '09:00', end: '17:00' }],
    friday: [{ start: '09:00', end: '17:00' }],
    saturday: [],
    sunday: [],
  });
  const [blackoutDates, setBlackoutDates] = useState<BlackoutDate[]>([]);
  const [schedulingEngine, setSchedulingEngine] = useState<SchedulingEngineConfig>({
    booking_mode: 'time_slot',
    default_lead_time_hours: 2,
    max_advance_booking_days: 60,
    cancellation_window_hours: 24,
    hold_duration_minutes: 10,
  });
  const [verificationPolicy, setVerificationPolicy] = useState<VerificationPolicyConfig>({
    require_otp_for_new_booking: false,
  });

  const [newBlackoutDate, setNewBlackoutDate] = useState('');
  const [newBlackoutReason, setNewBlackoutReason] = useState('');

  useEffect(() => {
    if (scheduleResponse?.data) {
      const data = scheduleResponse.data;
      if (data.timezone) setTimezone(data.timezone);
      if (data.currency) setCurrency(data.currency);
      if (data.operating_hours) {
        setOperatingHours({
          monday: data.operating_hours.monday || [],
          tuesday: data.operating_hours.tuesday || [],
          wednesday: data.operating_hours.wednesday || [],
          thursday: data.operating_hours.thursday || [],
          friday: data.operating_hours.friday || [],
          saturday: data.operating_hours.saturday || [],
          sunday: data.operating_hours.sunday || [],
        });
      }
      if (data.blackout_dates) {
        setBlackoutDates(data.blackout_dates);
      }
      if (data.scheduling_engine) {
        setSchedulingEngine({
          booking_mode: data.scheduling_engine.booking_mode || 'time_slot',
          default_lead_time_hours: data.scheduling_engine.default_lead_time_hours ?? 2,
          max_advance_booking_days: data.scheduling_engine.max_advance_booking_days ?? 60,
          cancellation_window_hours: data.scheduling_engine.cancellation_window_hours ?? 24,
          hold_duration_minutes: data.scheduling_engine.hold_duration_minutes ?? 10,
        });
      }
      if (data.verification_policy) {
        setVerificationPolicy({
          require_otp_for_new_booking:
            data.verification_policy.require_otp_for_new_booking ?? false,
        });
      }
    }
  }, [scheduleResponse]);

  const handleAddTimeSlot = (day: keyof OperatingHours) => {
    setOperatingHours((prev) => ({
      ...prev,
      [day]: [...prev[day], { start: '09:00', end: '17:00' }],
    }));
  };

  const handleRemoveTimeSlot = (day: keyof OperatingHours, index: number) => {
    setOperatingHours((prev) => ({
      ...prev,
      [day]: prev[day].filter((_, idx) => idx !== index),
    }));
  };

  const handleUpdateSlot = (
    day: keyof OperatingHours,
    index: number,
    field: keyof TimeInterval,
    value: string,
  ) => {
    setOperatingHours((prev) => {
      const updatedDaySlots = [...prev[day]];
      updatedDaySlots[index] = {
        ...updatedDaySlots[index],
        [field]: value,
      };
      return {
        ...prev,
        [day]: updatedDaySlots,
      };
    });
  };

  const handleToggleDayClosed = (day: keyof OperatingHours) => {
    setOperatingHours((prev) => {
      if (prev[day].length > 0) {
        return { ...prev, [day]: [] };
      }
      return { ...prev, [day]: [{ start: '09:00', end: '17:00' }] };
    });
  };

  const handleAddBlackoutDate = () => {
    if (!newBlackoutDate) return;
    setBlackoutDates((prev) => [
      ...prev,
      {
        date: newBlackoutDate,
        reason: newBlackoutReason || 'Holiday / Closed',
        is_closed: true,
      },
    ]);
    setNewBlackoutDate('');
    setNewBlackoutReason('');
    toast.success('Blackout date added to schedule.');
  };

  const handleRemoveBlackoutDate = (index: number) => {
    setBlackoutDates((prev) => prev.filter((_, idx) => idx !== index));
    toast.info('Blackout date removed.');
  };

  const handleSave = () => {
    if (!effectiveAgentId) {
      toast.error('Please select an agent first.');
      return;
    }

    updateMutation.mutate(
      {
        agent_id: effectiveAgentId,
        timezone,
        currency,
        operating_hours: operatingHours,
        blackout_dates: blackoutDates,
        scheduling_engine: schedulingEngine,
        verification_policy: verificationPolicy,
      },
      {
        onSuccess: () => {
          toast.success('Schedule settings saved and synced with AI agent!');
        },
        onError: (err) => {
          toast.error(err.message || 'Failed to update schedule settings.');
        },
      },
    );
  };

  if (isLoadingAgents || (effectiveAgentId && isLoadingSchedule)) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-slate-800" />
        <span className="text-xs font-semibold text-slate-600">Loading schedule settings...</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto flex flex-col gap-6 sm:gap-8 font-sans">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 tracking-wide flex-wrap">
        <span>Settings &amp; Configuration</span>
        <span>/</span>
        <span className="text-slate-800 font-bold truncate">Schedule &amp; Availability</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 sm:pb-6 border-b border-slate-200">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <div className="p-1.5 sm:p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-slate-900">
              Schedule &amp; Availability
            </h1>
            {effectiveAgentId && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                Agent: {currentAgent?.name || effectiveAgentId.slice(-6)}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Configure global operating hours, blackout dates, booking intervals, and verification rules for this agent.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-2 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-xl transition cursor-pointer disabled:opacity-50 shadow-2xs"
            title="Refresh settings"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs disabled:opacity-50 active:scale-98"
          >
            {updateMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      {/* Notice Banner if Schedule baseline is used */}
      {isError && (
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-800 flex items-center gap-2.5 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Notice: {error?.message || 'Using default schedule baseline for this agent.'}</span>
        </div>
      )}

      {/* Section 1: Localization & Regional Parameters */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Timezone &amp; Regional Settings
            </h2>
            <p className="text-xs text-slate-500">
              Primary timezone and billing currency used to compute slot availability and render pricing.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Primary Timezone
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              All booking slots and operating hours are evaluated relative to this zone.
            </p>
            <div className="relative">
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all shadow-2xs cursor-pointer"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Billing Currency
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              Default currency code applied to bookable services and invoices.
            </p>
            <div className="relative">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all shadow-2xs cursor-pointer"
              >
                {COMMON_CURRENCIES.map((cur) => (
                  <option key={cur} value={cur}>
                    {cur}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Operating Hours */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Weekly Operating Hours
            </h2>
            <p className="text-xs text-slate-500">
              Set regular opening intervals for each day. The AI agent only schedules bookings inside these active windows.
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100/90 border-t border-slate-100 mt-1">
          {DAYS_OF_WEEK.map((day) => {
            const slots = operatingHours[day] || [];
            const isClosed = slots.length === 0;

            return (
              <div key={day} className="py-4 first:pt-4 last:pb-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="w-36 shrink-0">
                    <span className="text-xs sm:text-sm font-bold capitalize text-slate-900 block">
                      {day}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleDayClosed(day)}
                      className={`inline-flex items-center gap-1 mt-0.5 text-[11px] font-semibold transition cursor-pointer ${
                        isClosed
                          ? 'text-indigo-600 hover:text-indigo-700'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {isClosed ? '+ Mark as Open' : '✕ Mark as Closed'}
                    </button>
                  </div>

                  <div className="flex-1 flex flex-wrap items-center gap-2.5">
                    {isClosed ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        Closed (No slots available)
                      </span>
                    ) : (
                      slots.map((slot, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 rounded-xl p-1.5 pl-2.5 shadow-2xs"
                        >
                          <input
                            type="time"
                            value={slot.start}
                            onChange={(e) => handleUpdateSlot(day, idx, 'start', e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 shadow-2xs"
                          />
                          <span className="text-slate-400 text-xs font-medium px-0.5">to</span>
                          <input
                            type="time"
                            value={slot.end}
                            onChange={(e) => handleUpdateSlot(day, idx, 'end', e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 shadow-2xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveTimeSlot(day, idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer ml-1"
                            title="Remove interval"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {!isClosed && (
                    <button
                      type="button"
                      onClick={() => handleAddTimeSlot(day)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 transition cursor-pointer self-start sm:self-center shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Interval</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: Scheduling Engine Engine Rules */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Scheduling Engine Constraints
            </h2>
            <p className="text-xs text-slate-500">
              Guardrails governing lead time, advance booking limits, and temporary hold windows.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Default Booking Mode
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              Select between discrete time intervals or multi-day range allocations.
            </p>
            <select
              value={schedulingEngine.booking_mode}
              onChange={(e) =>
                setSchedulingEngine((prev) => ({
                  ...prev,
                  booking_mode: e.target.value as 'time_slot' | 'date_range',
                }))
              }
              className="w-full px-3.5 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all shadow-2xs cursor-pointer"
            >
              <option value="time_slot">Time Slot (Hourly / Service Duration)</option>
              <option value="date_range">Date Range (Multi-day / Daily Rental)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Lead Time (Hours)
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              Minimum advance notice required before an appointment can start.
            </p>
            <input
              type="number"
              min="0"
              value={schedulingEngine.default_lead_time_hours}
              onChange={(e) =>
                setSchedulingEngine((prev) => ({
                  ...prev,
                  default_lead_time_hours: Math.max(0, parseInt(e.target.value, 10) || 0),
                }))
              }
              className="w-full px-3.5 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Max Advance Booking (Days)
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              Maximum days into the future that customers are allowed to schedule.
            </p>
            <input
              type="number"
              min="1"
              value={schedulingEngine.max_advance_booking_days}
              onChange={(e) =>
                setSchedulingEngine((prev) => ({
                  ...prev,
                  max_advance_booking_days: Math.max(1, parseInt(e.target.value, 10) || 1),
                }))
              }
              className="w-full px-3.5 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Cancellation Window (Hours)
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              Cut-off window before start time during which cancellations are allowed.
            </p>
            <input
              type="number"
              min="0"
              value={schedulingEngine.cancellation_window_hours}
              onChange={(e) =>
                setSchedulingEngine((prev) => ({
                  ...prev,
                  cancellation_window_hours: Math.max(0, parseInt(e.target.value, 10) || 0),
                }))
              }
              className="w-full px-3.5 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all shadow-2xs"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Slot Hold Duration (Minutes)
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              How long a time slot is reserved while the customer completes details before auto-release.
            </p>
            <input
              type="number"
              min="1"
              max="60"
              value={schedulingEngine.hold_duration_minutes}
              onChange={(e) =>
                setSchedulingEngine((prev) => ({
                  ...prev,
                  hold_duration_minutes: Math.max(1, parseInt(e.target.value, 10) || 1),
                }))
              }
              className="w-full sm:w-1/2 px-3.5 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* Section 4: Blackout Dates */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Blackout Dates &amp; Closures
            </h2>
            <p className="text-xs text-slate-500">
              Specify single dates or special occasions when operations are halted (e.g. Holidays, Maintenance).
            </p>
          </div>
        </div>

        {/* Add Blackout Date Bar */}
        <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row items-center gap-3 shadow-2xs">
          <input
            type="date"
            value={newBlackoutDate}
            onChange={(e) => setNewBlackoutDate(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
          <input
            type="text"
            placeholder="Reason (e.g. New Year's Day, Facility Maintenance)"
            value={newBlackoutReason}
            onChange={(e) => setNewBlackoutReason(e.target.value)}
            className="flex-1 w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
          <button
            type="button"
            onClick={handleAddBlackoutDate}
            disabled={!newBlackoutDate}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs disabled:opacity-40 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Date</span>
          </button>
        </div>

        {/* List Blackout Dates */}
        {blackoutDates.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 font-medium">
            No blackout dates registered for this agent.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {blackoutDates.map((b, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 shadow-2xs transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200/60 shrink-0">
                    {b.date}
                  </span>
                  <span className="text-xs text-slate-700 font-medium truncate">
                    {b.reason || 'Closed'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveBlackoutDate(idx)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Remove blackout date"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 5: Verification & Security Policy */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Customer Verification &amp; Security Policy
            </h2>
            <p className="text-xs text-slate-500">
              Enforce phone number verification gates before appointments are confirmed in the system.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 border border-amber-200/60">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-900">
                Require OTP Verification for New Bookings
              </p>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                When enabled, first-time callers and customers must verify their phone via SMS OTP before a slot is booked.
              </p>
            </div>
          </div>
          <label className="relative inline-flex cursor-pointer items-center shrink-0 ml-4">
            <input
              type="checkbox"
              checked={verificationPolicy.require_otp_for_new_booking}
              onChange={(e) =>
                setVerificationPolicy({
                  require_otp_for_new_booking: e.target.checked,
                })
              }
              className="peer sr-only"
            />
            <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-slate-900 peer-checked:after:translate-x-full peer-focus:outline-none shadow-2xs" />
          </label>
        </div>
      </div>

      {/* Bottom Save Bar */}
      <div className="flex items-center justify-end gap-3 pt-2 pb-6 border-t border-slate-200/60">
        <button
          type="button"
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition active:scale-98 cursor-pointer disabled:opacity-50"
        >
          {updateMutation.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          <span>Save Schedule Settings</span>
        </button>
      </div>
    </div>
  );
}
