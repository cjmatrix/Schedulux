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
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Mail,
  Phone,
  Sparkles,
  User,
  Users,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import type { CreateBookingPayload } from '../api/bookingsApi';
import { useAvailability, useCreateBooking } from '../hooks/useBookings';
import { useResourcesList, useServicesList } from '../hooks/useServices';

interface CreateBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingCreated?: (booking: BookingInfo) => void;
  agentId?: string;
}

export function CreateBookingModal({
  isOpen,
  onClose,
  onBookingCreated,
  agentId,
}: CreateBookingModalProps) {
  const modalTitleId = useId();

  
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


  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedResourceId, setSelectedResourceId] = useState<string>('');


  const [viewMonthDate, setViewMonthDate] = useState<Date>(() => new Date());


  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [checkOutDate, setCheckOutDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });

  const [selectedSlot, setSelectedSlot] = useState<AvailableSlotInfo | null>(null);

  // Customer information
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [depositStatus, setDepositStatus] = useState<'pending' | 'verified' | 'waived'>('pending');
  const [errorMessage, setErrorMessage] = useState<string>('');


  useEffect(() => {
    if (services.length > 0 && !selectedServiceId) {
      setSelectedServiceId(services[0].service_id);
    }
  }, [services, selectedServiceId]);

  const selectedService = useMemo<ServiceInfo | undefined>(() => {
    return services.find((s) => s.service_id === selectedServiceId);
  }, [services, selectedServiceId]);

  const bookingMode = selectedService?.booking_mode || 'time_slot';


  const eligibleResources = useMemo<ResourceInfo[]>(() => {
    if (!selectedService || !selectedService.resource_requirements?.length) {
      return resources.filter((r) => r.is_bookable);
    }
    const allEligibleIds = new Set<string>();
    selectedService.resource_requirements.forEach((req) => {
      const isUserSelectable =
        req.selection_mode === 'user_selectable' ||
        (!req.selection_mode && req.resource_type === 'staff');
      if (isUserSelectable) {
        req.eligible_resource_ids?.forEach((id) => allEligibleIds.add(id));
      }
    });

    if (allEligibleIds.size === 0) {
      const staffResources = resources.filter((r) => r.is_bookable && r.resource_type === 'staff');
      return staffResources.length > 0 ? staffResources : resources.filter((r) => r.is_bookable);
    }
    return resources.filter((r) => allEligibleIds.has(r.resource_id));
  }, [selectedService, resources]);

  const availabilityParams = useMemo(() => {
    if (!selectedServiceId || !selectedDate) return undefined;

    if (bookingMode === 'date_range') {
      return {
        service_id: selectedServiceId,
        start_date: selectedDate,
        end_date: checkOutDate || selectedDate,
        agent_id: agentId,
        resource_id: selectedResourceId || undefined,
      };
    }

 
    return {
      service_id: selectedServiceId,
      start_date: selectedDate,
      end_date: selectedDate,
      agent_id: agentId,
      resource_id: selectedResourceId || undefined,
    };
  }, [selectedServiceId, bookingMode, selectedDate, checkOutDate, agentId, selectedResourceId]);

  const { data: availabilityData, isLoading: isLoadingAvailability } = useAvailability(
    availabilityParams,
    { enabled: isOpen && !!selectedServiceId && !!selectedDate },
  );

  const availability = availabilityData?.data;


  const daysMap = useMemo(() => {
    const map = new Map<string, DayAvailabilityInfo>();
    availability?.days?.forEach((d) => map.set(d.date, d));
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


  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedServiceId, selectedDate, selectedResourceId]);

  const createBookingMutation = useCreateBooking();

  if (!isOpen) return null;

 
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

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedService) {
      setErrorMessage('Please select a service.');
      return;
    }

    if (!customerName.trim()) {
      setErrorMessage('Customer name is required.');
      return;
    }

    if (!customerPhone.trim()) {
      setErrorMessage('Customer phone is required.');
      return;
    }

    let startTimeIso: string;
    let endTimeIso: string | undefined;

    if (bookingMode === 'time_slot') {
      if (!selectedSlot) {
        setErrorMessage('Please select an available time slot.');
        return;
      }
      startTimeIso = selectedSlot.start_time;
      endTimeIso = selectedSlot.end_time;
    } else {
      if (!selectedDate || !checkOutDate) {
        setErrorMessage('Please choose both check-in and check-out dates.');
        return;
      }
      if (checkOutDate <= selectedDate) {
        setErrorMessage('Check-out date must be after check-in date.');
        return;
      }
      startTimeIso = `${selectedDate}T00:00:00.000Z`;
      endTimeIso = `${checkOutDate}T23:59:59.999Z`;
    }

    const payload: CreateBookingPayload = {
      agent_id: agentId,
      service_id: selectedService.service_id,
      resource_id: selectedResourceId || undefined,
      start_time: startTimeIso,
      end_time: endTimeIso,
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      customer_email: customerEmail.trim() || undefined,
      notes: notes.trim() || undefined,
      source: 'manual',
      deposit_status: selectedService.deposit?.required ? depositStatus : 'not_required',
    };

    try {
      const res = await createBookingMutation.mutateAsync(payload);
      if (res.data) {
        onBookingCreated?.(res.data);
      }
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to create booking.';
      setErrorMessage(msg);
    }
  };

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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-2xl w-full flex pl-10">
        <div className="w-full bg-white shadow-2xl flex flex-col h-full overflow-hidden border-l border-slate-200">
          {/* Header */}
          <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Sparkles className="w-4 h-4" />
                </span>
                <h2 id={modalTitleId} className="text-lg font-bold tracking-tight text-white">
                  Manual Reservation
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Dispatch staff, reserve units, and view live availability in real-time.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Booking Conflict or Error</div>
                  <div className="mt-0.5 text-rose-700">{errorMessage}</div>
                </div>
              </div>
            )}

            {/* 1. Service Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                1. Select Service *
              </label>
              <div className="relative">
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition cursor-pointer appearance-none"
                >
                  {services.map((svc) => (
                    <option key={svc.service_id} value={svc.service_id}>
                      {svc.name} — {svc.booking_mode === 'date_range' ? 'Daily / Nightly' : `${svc.duration_minutes} mins`} ({svc.price?.amount ? `$${svc.price.amount}` : 'Free'})
                    </option>
                  ))}
                </select>
                <Clock className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {selectedService && (
                <div className="flex items-center justify-between text-xs px-3 py-2 bg-slate-100/70 rounded-xl text-slate-600">
                  <span>
                    Mode: <strong className="text-slate-900 capitalize">{bookingMode.replace('_', ' ')}</strong>
                  </span>
                  <span>
                    Price: <strong className="text-slate-900">${selectedService.price?.amount || 0} {selectedService.price?.currency || 'USD'}</strong>
                  </span>
                  {selectedService.deposit?.required && (
                    <span className="text-amber-700 font-medium">
                      Deposit: ${selectedService.deposit.amount}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 2. Resource Assignment */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  2. Resource / Provider
                </label>
                <span className="text-[11px] text-slate-400">Optional</span>
              </div>
              <div className="relative">
                <select
                  value={selectedResourceId}
                  onChange={(e) => setSelectedResourceId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition cursor-pointer appearance-none"
                >
                  <option value="">Auto-Assign Optimal Available Resource (Recommended)</option>
                  {eligibleResources.map((res) => (
                    <option key={res.resource_id} value={res.resource_id}>
                      {res.name} — {res.title || res.resource_type}
                    </option>
                  ))}
                </select>
                <Users className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 3. Live Interactive Calendar & Availability */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  3. Live Availability & Date Selection *
                </label>
                {isLoadingAvailability && (
                  <span className="flex items-center gap-1.5 text-xs text-blue-600 font-medium">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking slots...
                  </span>
                )}
              </div>

              {bookingMode === 'time_slot' ? (
                <>
                  {/* Mini Calendar Header */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-slate-800">{monthYearLabel}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handlePrevMonth}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 transition text-slate-600"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleNextMonth}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 transition text-slate-600"
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

                    {/* Calendar Cells */}
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
                            onClick={() => setSelectedDate(cell.dateStr)}
                            className={`h-9 rounded-xl flex flex-col items-center justify-center text-xs font-semibold relative transition ${
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
                </>
              ) : null}

              {/* Slot / Range Picker based on booking mode */}
              {bookingMode === 'time_slot' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">
                      Slots for <strong className="text-slate-900">{selectedDate}</strong>
                    </span>
                    {selectedSlot && (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Selected: {formatSlotTime(selectedSlot.start_time)}
                      </span>
                    )}
                  </div>

                  {slotsForSelectedDay.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs text-center">
                      No operating hours or slots configured for this date.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                      {/* Morning */}
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
                                  className={`px-2.5 py-2 rounded-xl text-xs font-semibold border transition flex items-center justify-center gap-1 ${
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

                      {/* Afternoon */}
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
                                  className={`px-2.5 py-2 rounded-xl text-xs font-semibold border transition flex items-center justify-center gap-1 ${
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

                      {/* Evening */}
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
                                  className={`px-2.5 py-2 rounded-xl text-xs font-semibold border transition flex items-center justify-center gap-1 ${
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
              ) : (
                /* Date Range Picker */
                <div className="space-y-3">
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

                  {/* Resource units status */}
                  {availability?.resources && availability.resources.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Unit / Room Status {selectedDate ? `(${selectedDate}${checkOutDate && checkOutDate !== selectedDate ? ` → ${checkOutDate}` : ''})` : ''}:
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {availability.resources.map((res) => {
                          const isAvailable = isResourceAvailableForSelectedDates(res.resource_id);
                          return (
                            <div
                              key={res.resource_id}
                              className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                                isAvailable
                                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                                  : 'bg-slate-100 border-slate-200 text-slate-400 line-through'
                              }`}
                            >
                              <span className="font-semibold">{res.name}</span>
                              <span className="text-[10px] font-bold uppercase">
                                {isAvailable ? 'Available' : 'Booked'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 4. Customer Details */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                4. Customer Information *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="block text-[11px] font-medium text-slate-500 mb-1">
                    Full Name *
                  </span>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. David Miller"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <span className="block text-[11px] font-medium text-slate-500 mb-1">
                    Phone Number *
                  </span>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="e.g. +1 555-0192"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <span className="block text-[11px] font-medium text-slate-500 mb-1">
                    Email Address
                  </span>
                  <div className="relative">
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="e.g. david.miller@example.com"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              <div>
                <span className="block text-[11px] font-medium text-slate-500 mb-1">
                  Internal Notes
                </span>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes, allergies, customer special requests..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
              </div>

              {selectedService?.deposit?.required && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-amber-900">Deposit Status:</span>
                    <span className="text-amber-700 ml-1.5">${selectedService.deposit.amount} required</span>
                  </div>
                  <select
                    value={depositStatus}
                    onChange={(e) => setDepositStatus(e.target.value as any)}
                    className="px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-xs font-bold text-amber-900"
                  >
                    <option value="pending">Pending</option>
                    <option value="verified">Verified (Paid)</option>
                    <option value="waived">Waived by Staff</option>
                  </select>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={createBookingMutation.isPending || (bookingMode === 'time_slot' && !selectedSlot)}
                className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {createBookingMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Booking...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Confirm & Create Booking</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
