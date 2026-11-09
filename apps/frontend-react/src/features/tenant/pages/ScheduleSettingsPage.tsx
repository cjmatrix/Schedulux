import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Globe,
  Loader2,
  Lock,
  Plus,
  Save,
  Shield,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
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
  const { data: agents = [], isLoading: isLoadingAgents } = useTenantAgents();

  const [selectedAgentId, setSelectedAgentId] = useState<string>('');

  useEffect(() => {
    if (routeAgentId) {
      setSelectedAgentId(routeAgentId);
    } else if (agents.length > 0 && !selectedAgentId) {
      setSelectedAgentId(agents[0].agent_id);
    }
  }, [routeAgentId, agents, selectedAgentId]);

  const {
    data: scheduleResponse,
    isLoading: isLoadingSchedule,
    isError,
    error,
  } = useTenantSchedule(selectedAgentId || undefined);

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
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');
  const [saveErrorMessage, setSaveErrorMessage] = useState('');

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
  };

  const handleRemoveBlackoutDate = (index: number) => {
    setBlackoutDates((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSave = () => {
    if (!selectedAgentId) {
      setSaveErrorMessage('Please select an agent first.');
      return;
    }
    setSaveSuccessMessage('');
    setSaveErrorMessage('');

    updateMutation.mutate(
      {
        agent_id: selectedAgentId,
        timezone,
        currency,
        operating_hours: operatingHours,
        blackout_dates: blackoutDates,
        scheduling_engine: schedulingEngine,
        verification_policy: verificationPolicy,
      },
      {
        onSuccess: () => {
          setSaveSuccessMessage('Tenant schedule settings saved and synchronized to AI agent!');
          setTimeout(() => setSaveSuccessMessage(''), 5000);
        },
        onError: (err) => {
          setSaveErrorMessage(err.message || 'Failed to update schedule settings.');
        },
      },
    );
  };

  if (isLoadingAgents || (selectedAgentId && isLoadingSchedule)) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-slate-600 font-medium">Loading schedule settings...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Schedule & Availability Settings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Configure global operating hours, blackout dates, scheduling constraints, and security
            policies for your agent.
          </p>
        </div>

        {/* Agent Picker & Save CTA */}
        <div className="flex items-center gap-3">
          {agents.length > 1 && (
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {agents.map((a) => (
                <option key={a.agent_id} value={a.agent_id}>
                  {a.name || a.agent_id}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccessMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {saveErrorMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span>{saveErrorMessage}</span>
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <span>Notice: {error?.message || 'Using default schedule baseline.'}</span>
        </div>
      )}

      {/* Section 1: Localization */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-slate-900">Timezone & Currency</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Primary Timezone</label>
            <p className="text-xs text-slate-500 mb-2">
              Used to calculate and convert available time slots.
            </p>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Billing Currency</label>
            <p className="text-xs text-slate-500 mb-2">
              Default currency used across service pricing.
            </p>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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

      {/* Section 2: Operating Hours */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-slate-900">Weekly Operating Hours</h2>
        </div>
        <p className="text-xs text-slate-500 mb-6">
          Set regular opening hours for each day. Customers and the AI Agent will only schedule
          bookings within these windows.
        </p>

        <div className="divide-y divide-slate-100">
          {DAYS_OF_WEEK.map((day) => {
            const slots = operatingHours[day] || [];
            const isClosed = slots.length === 0;

            return (
              <div key={day} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="w-32 shrink-0">
                    <span className="text-sm font-semibold capitalize text-slate-800">{day}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleDayClosed(day)}
                      className={`block mt-1 text-xs font-medium underline ${
                        isClosed ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {isClosed ? 'Mark as Open' : 'Mark as Closed'}
                    </button>
                  </div>

                  <div className="flex-1 space-y-2">
                    {isClosed ? (
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        Closed (No slots available)
                      </span>
                    ) : (
                      slots.map((slot, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="time"
                            value={slot.start}
                            onChange={(e) => handleUpdateSlot(day, idx, 'start', e.target.value)}
                            className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                          <span className="text-slate-400 font-medium">to</span>
                          <input
                            type="time"
                            value={slot.end}
                            onChange={(e) => handleUpdateSlot(day, idx, 'end', e.target.value)}
                            className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveTimeSlot(day, idx)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                            title="Remove interval"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {!isClosed && (
                    <button
                      type="button"
                      onClick={() => handleAddTimeSlot(day)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 self-start sm:self-center"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Interval
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: Scheduling Engine Engine Rules */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-slate-900">Scheduling Engine Rules</h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Default Booking Mode</label>
            <p className="text-xs text-slate-500 mb-2">
              Controls whether appointments use discrete time slots or multi-day ranges.
            </p>
            <select
              value={schedulingEngine.booking_mode}
              onChange={(e) =>
                setSchedulingEngine((prev) => ({
                  ...prev,
                  booking_mode: e.target.value as 'time_slot' | 'date_range',
                }))
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="time_slot">Time Slot (Hourly / Service Duration)</option>
              <option value="date_range">Date Range (Hotel / Daily Rental)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Lead Time (Hours)</label>
            <p className="text-xs text-slate-500 mb-2">
              Minimum advance notice required prior to booking.
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
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Max Advance Booking (Days)
            </label>
            <p className="text-xs text-slate-500 mb-2">
              How far in advance customers are allowed to schedule.
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
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Cancellation Window (Hours)
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Cut-off window before start time for cancellations.
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
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">
              Slot Hold Duration (Minutes)
            </label>
            <p className="text-xs text-slate-500 mb-2">
              How long a slot is reserved while the user completes payment or details before
              releasing.
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
              className="w-full sm:w-1/2 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Section 4: Blackout Dates */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-slate-900">Blackout Dates & Closures</h2>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Add specific dates when your business is closed (e.g. National Holidays, Maintenance).
        </p>

        {/* Add Blackout Date Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-6 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <input
            type="date"
            value={newBlackoutDate}
            onChange={(e) => setNewBlackoutDate(e.target.value)}
            className="w-full sm:w-auto rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Reason (e.g. New Year's Day, Renovation)"
            value={newBlackoutReason}
            onChange={(e) => setNewBlackoutReason(e.target.value)}
            className="flex-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleAddBlackoutDate}
            disabled={!newBlackoutDate}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1 rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
            Add Date
          </button>
        </div>

        {/* List Blackout Dates */}
        {blackoutDates.length === 0 ? (
          <p className="text-sm text-slate-400 italic">No blackout dates added.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {blackoutDates.map((b, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{b.date}</p>
                  <p className="text-xs text-slate-500">{b.reason || 'Closed'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveBlackoutDate(idx)}
                  className="text-slate-400 hover:text-red-600 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 5: Verification & Security Policy */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-slate-900">Verification & Security Policy</h2>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-4">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-slate-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Require OTP Verification for New Bookings
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                When enabled, first-time customers must verify their phone number via SMS OTP before
                their booking is confirmed.
              </p>
            </div>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
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
            <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-focus:outline-none" />
          </label>
        </div>
      </div>

      {/* Bottom Save Bar */}
      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {updateMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Settings
        </button>
      </div>
    </div>
  );
}
