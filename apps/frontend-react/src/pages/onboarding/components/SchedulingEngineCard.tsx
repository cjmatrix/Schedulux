import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Layers,
  Lock,
  RotateCcw,
} from 'lucide-react';
import React from 'react';
import type { SchedulingEngineData } from '../types';

interface SchedulingEngineCardProps {
  schedulingEngine?: SchedulingEngineData;
}

export const SchedulingEngineCard: React.FC<SchedulingEngineCardProps> = ({ schedulingEngine }) => {
  const bookingMode =
    schedulingEngine?.booking_mode || schedulingEngine?.default_booking_mode || 'time_slot';
  const leadTimeHours = schedulingEngine?.default_lead_time_hours ?? 2;
  const advanceDays = schedulingEngine?.max_advance_booking_days ?? 60;
  const cancelHours = schedulingEngine?.cancellation_window_hours ?? 24;
  const holdMinutes = schedulingEngine?.hold_duration_minutes ?? 10;

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-6 shadow-2xs space-y-5 min-w-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 shrink-0 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
            <CalendarClock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Scheduling Engine &amp; Booking Guardrails
              </h3>
              <span className="bg-indigo-50 text-indigo-700 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shrink-0">
                Active Engine
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Deterministic advance booking limits, cancellation cutoffs, and slot concurrency hold
              locks
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Engine Parameters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Booking Model */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              Primary Booking Model
            </label>
            <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md uppercase">
              {bookingMode}
            </span>
          </div>
          <p className="text-xs font-bold text-slate-900">
            {bookingMode === 'date_range'
              ? 'Multi-Day Date Range (Hotels / Rentals)'
              : 'Clock Time Slot (Appointments / Procedures)'}
          </p>
          <p className="text-[11px] text-slate-500">
            {bookingMode === 'date_range'
              ? 'Bookings evaluate check-in / check-out dates over full calendar days.'
              : 'Appointments allocate granular clock start & end times within operating hours.'}
          </p>
        </div>

        {/* Lead Time */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Minimum Booking Lead Time
            </label>
            <span className="text-[10px] font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
              {leadTimeHours} hrs notice
            </span>
          </div>
          <p className="text-xs font-bold text-slate-900">
            {leadTimeHours} {leadTimeHours === 1 ? 'hour' : 'hours'} required
          </p>
          <p className="text-[11px] text-slate-500">
            Prevents customers from booking same-day slots without sufficient advance notice.
          </p>
        </div>

        {/* Cancellation Window */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
              Cancellation &amp; Reschedule Cutoff
            </label>
            <span className="text-[10px] font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
              {cancelHours} hrs cutoff
            </span>
          </div>
          <p className="text-xs font-bold text-slate-900">
            {cancelHours} {cancelHours === 1 ? 'hour' : 'hours'} prior to appointment
          </p>
          <p className="text-[11px] text-slate-500">
            Late cancellations within this window are rejected or escalated to front-desk staff.
          </p>
        </div>

        {/* Max Advance Days & Temporary Lock */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-500" />
              Advance Window &amp; Slot Hold
            </label>
            <span className="text-[10px] font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
              {advanceDays}d / {holdMinutes}m hold
            </span>
          </div>
          <p className="text-xs font-bold text-slate-900">
            Max {advanceDays} days forward • {holdMinutes}-min lock
          </p>
          <p className="text-[11px] text-slate-500">
            Slots are temporarily reserved for {holdMinutes} minutes while clients complete
            verification.
          </p>
        </div>
      </div>

      {/* Footer policy reassurance */}
      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>
            Rules are strictly enforced at runtime by distributed MongoDB ACID transactions
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">Engine Mode: {bookingMode}</span>
      </div>
    </div>
  );
};
