import type {
  AvailableSlotInfo,
  BookingInfo,
  DayAvailabilityInfo,
  ResourceInfo,
  ServiceInfo,
} from '@repo/proto/scheduling';
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Users,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAvailability, useRescheduleBooking } from '../hooks/useBookings';
import { useResourcesList, useServicesList } from '../hooks/useServices';

interface RescheduleBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingInfo | null;
  agentId: string;
  onSuccess?: () => void;
}

export function RescheduleBookingModal({
  isOpen,
  onClose,
  booking,
  agentId,
  onSuccess,
}: RescheduleBookingModalProps) {
  const rescheduleMutation = useRescheduleBooking();

  const { data: servicesData } = useServicesList({
    limit: 100,
    agent_id: agentId,
  });
  const { data: resourcesData } = useResourcesList({
    limit: 100,
    agent_id: agentId,
  });

  const services = useMemo(() => servicesData?.data || [], [servicesData]);
  const resources = useMemo(() => resourcesData?.data || [], [resourcesData]);

  const matchedService = useMemo<ServiceInfo | undefined>(() => {
    if (!booking) return undefined;
    return services.find((s) => s.service_id === booking.service_id);
  }, [services, booking]);

  const bookingMode = matchedService?.booking_mode || booking?.booking_mode || 'time_slot';

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (booking?.start_time) {
      return booking.start_time.split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  });

  const [checkOutDate, setCheckOutDate] = useState<string>(() => {
    if (booking?.end_time && booking.end_time.split('T')[0] !== booking.start_time?.split('T')[0]) {
      return booking.end_time.split('T')[0];
    }
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });

  const [selectedSlot, setSelectedSlot] = useState<AvailableSlotInfo | null>(null);
  const [selectedResourceId, setSelectedResourceId] = useState<string>('');
  const [rescheduleNotes, setRescheduleNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [viewMonthDate, setViewMonthDate] = useState<Date>(() => {
    if (booking?.start_time) {
      return new Date(booking.start_time);
    }
    return new Date();
  });

  useEffect(() => {
    if (booking) {
      if (booking.start_time) {
        const dStr = booking.start_time.split('T')[0];
        setSelectedDate(dStr);
        setViewMonthDate(new Date(booking.start_time));
      }
      if (booking.resource_id) {
        setSelectedResourceId(booking.resource_id);
      } else if (booking.resource_ids && booking.resource_ids.length > 0) {
        setSelectedResourceId(booking.resource_ids[0]);
      } else {
        setSelectedResourceId('');
      }
      setSelectedSlot(null);
      setErrorMessage('');
      setRescheduleNotes('');
    }
  }, [booking]);

  const eligibleResources = useMemo<ResourceInfo[]>(() => {
    if (!matchedService || !matchedService.resource_requirements?.length) {
      return resources.filter((r) => r.is_bookable);
    }
    const allEligibleIds = new Set<string>();
    matchedService.resource_requirements.forEach((req) => {
      const isUserSelectable =
        req.selection_mode === 'user_selectable' ||
        (!req.selection_mode && req.resource_type === 'staff');
      if (isUserSelectable) {
        req.eligible_resource_ids?.forEach((id) => {
          allEligibleIds.add(id);
        });
      }
    });

    if (allEligibleIds.size === 0) {
      const staffResources = resources.filter((r) => r.is_bookable && r.resource_type === 'staff');
      return staffResources.length > 0 ? staffResources : resources.filter((r) => r.is_bookable);
    }
    return resources.filter((r) => allEligibleIds.has(r.resource_id));
  }, [matchedService, resources]);

  const availabilityParams = useMemo(() => {
    if (!booking?.service_id || !selectedDate) return undefined;

    if (bookingMode === 'date_range') {
      return {
        service_id: booking.service_id,
        start_date: selectedDate,
        end_date: checkOutDate || selectedDate,
        agent_id: agentId,
        resource_id: selectedResourceId || undefined,
      };
    }

    return {
      service_id: booking.service_id,
      start_date: selectedDate,
      end_date: selectedDate,
      agent_id: agentId,
      resource_id: selectedResourceId || undefined,
    };
  }, [booking?.service_id, bookingMode, selectedDate, checkOutDate, agentId, selectedResourceId]);

  const { data: availabilityData, isLoading: isLoadingAvailability } = useAvailability(
    availabilityParams,
    { enabled: isOpen && !!booking?.service_id && !!selectedDate },
  );

  const availability = availabilityData?.data;

  const daysMap = useMemo(() => {
    const map = new Map<string, DayAvailabilityInfo>();
    availability?.days?.forEach((d) => {
      map.set(d.date, d);
    });
    return map;
  }, [availability]);

  const selectedDayInfo = useMemo(() => {
    return daysMap.get(selectedDate);
  }, [daysMap, selectedDate]);

  const slotsForSelectedDay = useMemo(() => {
    return selectedDayInfo?.slots || [];
  }, [selectedDayInfo]);

  const { morningSlots, afternoonSlots, eveningSlots } = useMemo(() => {
    const morning: AvailableSlotInfo[] = [];
    const afternoon: AvailableSlotInfo[] = [];
    const evening: AvailableSlotInfo[] = [];

    slotsForSelectedDay.forEach((s) => {
      const timePart = s.start_time.split('T')[1] || '';
      const hour = parseInt(timePart.split(':')[0] || '0', 10);
      if (hour < 12) {
        morning.push(s);
      } else if (hour < 17) {
        afternoon.push(s);
      } else {
        evening.push(s);
      }
    });

    return { morningSlots: morning, afternoonSlots: afternoon, eveningSlots: evening };
  }, [slotsForSelectedDay]);

  const isResourceAvailableForSelectedDates = useCallback(
    (resourceId: string): boolean => {
      if (bookingMode === 'date_range') {
        const resInfo = availability?.resources?.find((r) => r.resource_id === resourceId);
        if (resInfo !== undefined) {
          return resInfo.is_available;
        }
      }
      return true;
    },
    [availability, bookingMode],
  );

  if (!isOpen || !booking) return null;

  const handlePrevMonth = () => {
    setViewMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const monthYearLabel = viewMonthDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const calendarGrid = (() => {
    const year = viewMonthDate.getFullYear();
    const month = viewMonthDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const startOffset = (firstDayIndex + 6) % 7;
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: Array<{ dateStr: string; dayNum: number; isCurrentMonth: boolean }> = [];
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    for (let i = startOffset - 1; i >= 0; i--) {
      const day = prevMonthTotalDays - i;
      const prevDate = new Date(Date.UTC(year, month - 1, day));
      cells.push({
        dateStr: prevDate.toISOString().split('T')[0],
        dayNum: day,
        isCurrentMonth: false,
      });
    }

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const d = new Date(Date.UTC(year, month, day));
      cells.push({
        dateStr: d.toISOString().split('T')[0],
        dayNum: day,
        isCurrentMonth: true,
      });
    }

    const remaining = (7 - (cells.length % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
      const d = new Date(Date.UTC(year, month + 1, day));
      cells.push({
        dateStr: d.toISOString().split('T')[0],
        dayNum: day,
        isCurrentMonth: false,
      });
    }

    return cells;
  })();

  const formatSlotTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'UTC',
      });
    } catch {
      return iso;
    }
  };

  const currentBookingDate = booking.start_time
    ? new Date(booking.start_time).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  const currentBookingTime = booking.start_time
    ? new Date(booking.start_time).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    let newStartTime: string;
    let newEndTime: string | undefined;

    if (bookingMode === 'time_slot') {
      if (!selectedSlot) {
        setErrorMessage('Please select a new available time slot.');
        return;
      }
      if (new Date(selectedSlot.start_time).getTime() < Date.now()) {
        setErrorMessage(
          'The selected time slot has already passed. Please choose an upcoming slot.',
        );
        return;
      }
      newStartTime = selectedSlot.start_time;
      newEndTime = selectedSlot.end_time;
    } else {
      if (!selectedDate || !checkOutDate) {
        setErrorMessage('Please choose both check-in and check-out dates.');
        return;
      }
      if (selectedDate < todayStr) {
        setErrorMessage('Check-in date cannot be in the past.');
        return;
      }
      if (checkOutDate <= selectedDate) {
        setErrorMessage('Check-out date must be after check-in date.');
        return;
      }
      newStartTime = `${selectedDate}T00:00:00.000Z`;
      newEndTime = `${checkOutDate}T23:59:59.999Z`;
    }

    rescheduleMutation.mutate(
      {
        bookingId: booking.booking_id,
        agentId,
        newStartTime,
        newEndTime,
        resourceId: selectedResourceId || undefined,
        notes: rescheduleNotes.trim() || undefined,
      },
      {
        onSuccess: () => {
          onClose();
          onSuccess?.();
        },
        onError: (err: unknown) => {
          setErrorMessage(err instanceof Error ? err.message : 'Failed to reschedule booking.');
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-xl w-full flex pl-10">
        <div className="w-full bg-white shadow-2xl flex flex-col h-full overflow-hidden border-l border-slate-200">
          {/* Header */}
          <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <RefreshCw className="w-4 h-4" />
                </span>
                <h2 className="text-lg font-bold tracking-tight text-white">
                  Reschedule Appointment
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Ref:{' '}
                <span className="font-mono font-semibold text-slate-200">
                  {booking.booking_reference || booking.booking_id.slice(-6)}
                </span>{' '}
                • {booking.customer?.name || 'Customer'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={rescheduleMutation.isPending}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleRescheduleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Current Schedule Summary */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Currently Scheduled
              </span>
              <div className="flex justify-between text-slate-700">
                <span className="text-slate-500 font-medium">Service:</span>
                <span className="font-semibold text-slate-900">
                  {matchedService?.name || 'Appointment'}
                </span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span className="text-slate-500 font-medium">Date & Time:</span>
                <span className="font-semibold text-slate-900">
                  {currentBookingDate} at {currentBookingTime}
                </span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Reschedule Conflict or Error</div>
                  <div className="text-rose-700 mt-0.5">{errorMessage}</div>
                </div>
              </div>
            )}

            {/* 1. Date Selection & Mini Calendar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  1. Select New Date *
                </label>
                {isLoadingAvailability && (
                  <span className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking slots...
                  </span>
                )}
              </div>

              {bookingMode === 'time_slot' ? (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-slate-800">{monthYearLabel}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handlePrevMonth}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 transition text-slate-600 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextMonth}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 transition text-slate-600 cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Day of week labels */}
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase mb-1">
                    <div>Mo</div>
                    <div>Tu</div>
                    <div>We</div>
                    <div>Th</div>
                    <div>Fr</div>
                    <div>Sa</div>
                    <div>Su</div>
                  </div>

                  {/* Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarGrid.map((cell) => {
                      const isSelected = cell.dateStr === selectedDate;
                      const isPast = cell.dateStr < todayStr;
                      const dayInfo = isSelected ? daysMap.get(cell.dateStr) : undefined;
                      const isClosed = dayInfo?.is_closed;

                      return (
                        <button
                          key={cell.dateStr}
                          type="button"
                          disabled={isPast || !cell.isCurrentMonth}
                          onClick={() => {
                            setSelectedDate(cell.dateStr);
                            setSelectedSlot(null);
                          }}
                          className={`h-9 rounded-xl flex flex-col items-center justify-center text-xs font-semibold relative transition cursor-pointer ${
                            !cell.isCurrentMonth || isPast
                              ? 'text-slate-300 opacity-40 cursor-not-allowed'
                              : isSelected
                                ? 'bg-slate-900 text-white shadow-xs'
                                : isClosed
                                  ? 'bg-slate-100/60 text-slate-300 cursor-not-allowed line-through'
                                  : 'bg-white text-slate-700 hover:bg-slate-200/60'
                          }`}
                        >
                          <span>{cell.dayNum}</span>
                          {isSelected && dayInfo?.has_availability && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute bottom-1" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Date Range Picker */
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="block text-[11px] font-medium text-slate-500 mb-1">
                      Check-in Date
                    </span>
                    <input
                      type="date"
                      required
                      min={todayStr}
                      value={selectedDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedDate(val);
                        if (checkOutDate <= val) {
                          const next = new Date(`${val}T00:00:00Z`);
                          next.setUTCDate(next.getUTCDate() + 1);
                          setCheckOutDate(next.toISOString().split('T')[0]);
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <span className="block text-[11px] font-medium text-slate-500 mb-1">
                      Check-out Date
                    </span>
                    <input
                      type="date"
                      required
                      min={selectedDate || todayStr}
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 2. Slot Selection */}
            {bookingMode === 'time_slot' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">
                    Available Slots for <strong className="text-slate-900">{selectedDate}</strong>
                  </span>
                  {selectedSlot && (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Selected:{' '}
                      {formatSlotTime(selectedSlot.start_time)}
                    </span>
                  )}
                </div>

                {slotsForSelectedDay.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs text-center">
                    No operating hours or open slots on this date.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                    {morningSlots.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Morning
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {morningSlots.map((slot) => {
                            const isSelected = selectedSlot?.start_time === slot.start_time;
                            return (
                              <button
                                key={slot.start_time}
                                type="button"
                                disabled={!slot.available}
                                onClick={() => setSelectedSlot(slot)}
                                className={`px-2.5 py-2 rounded-xl text-xs font-semibold border transition flex items-center justify-center gap-1 cursor-pointer ${
                                  isSelected
                                    ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                                    : slot.available
                                      ? 'bg-white border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                                      : 'bg-slate-100 border-slate-100 text-slate-400 cursor-not-allowed line-through'
                                }`}
                              >
                                {formatSlotTime(slot.start_time)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {afternoonSlots.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Afternoon
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {afternoonSlots.map((slot) => {
                            const isSelected = selectedSlot?.start_time === slot.start_time;
                            return (
                              <button
                                key={slot.start_time}
                                type="button"
                                disabled={!slot.available}
                                onClick={() => setSelectedSlot(slot)}
                                className={`px-2.5 py-2 rounded-xl text-xs font-semibold border transition flex items-center justify-center gap-1 cursor-pointer ${
                                  isSelected
                                    ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                                    : slot.available
                                      ? 'bg-white border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                                      : 'bg-slate-100 border-slate-100 text-slate-400 cursor-not-allowed line-through'
                                }`}
                              >
                                {formatSlotTime(slot.start_time)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {eveningSlots.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Evening
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {eveningSlots.map((slot) => {
                            const isSelected = selectedSlot?.start_time === slot.start_time;
                            return (
                              <button
                                key={slot.start_time}
                                type="button"
                                disabled={!slot.available}
                                onClick={() => setSelectedSlot(slot)}
                                className={`px-2.5 py-2 rounded-xl text-xs font-semibold border transition flex items-center justify-center gap-1 cursor-pointer ${
                                  isSelected
                                    ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                                    : slot.available
                                      ? 'bg-white border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                                      : 'bg-slate-100 border-slate-100 text-slate-400 cursor-not-allowed line-through'
                                }`}
                              >
                                {formatSlotTime(slot.start_time)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 3. Resource / Staff Assignment */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  2. Assigned Provider / Staff
                </label>
                <span className="text-[11px] text-slate-400">Optional</span>
              </div>
              <div className="relative">
                <select
                  value={selectedResourceId}
                  onChange={(e) => setSelectedResourceId(e.target.value)}
                  disabled={rescheduleMutation.isPending}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition cursor-pointer appearance-none"
                >
                  <option value="">Keep / Auto-Assign Available Resource</option>
                  {eligibleResources.map((res) => (
                    <option key={res.resource_id} value={res.resource_id}>
                      {res.name} — {res.title || res.resource_type}
                      {!isResourceAvailableForSelectedDates(res.resource_id)
                        ? ' (Unavailable)'
                        : ''}
                    </option>
                  ))}
                </select>
                <Users className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 4. Notes */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                3. Reschedule Note / Reason
              </label>
              <textarea
                value={rescheduleNotes}
                onChange={(e) => setRescheduleNotes(e.target.value)}
                rows={2}
                placeholder="Reason or notes regarding this reschedule..."
                disabled={rescheduleMutation.isPending}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition resize-none"
              />
            </div>

            {/* Actions */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={rescheduleMutation.isPending}
                className="px-4 py-2.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={rescheduleMutation.isPending}
                className="px-5 py-2.5 rounded-full bg-slate-950 hover:bg-black text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {rescheduleMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Reschedule</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
