import type { BookingInfo, ResourceInfo, ServiceInfo } from '@repo/proto/scheduling';
import {
  CalendarX,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Plus,
  RefreshCw,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface BookingsCalendarViewProps {
  bookings: BookingInfo[];
  isLoading: boolean;
  services: ServiceInfo[];
  resources: ResourceInfo[];
  currentDate: Date;
  onDateChange: (newDate: Date) => void;
  onSelectBooking: (booking: BookingInfo) => void;
  onReschedule: (booking: BookingInfo) => void;
  onCancel: (booking: BookingInfo) => void;
  onNewBookingForDate?: (dateStr: string) => void;
}

type CalendarMode = 'month' | 'week';

export function BookingsCalendarView({
  bookings,
  isLoading,
  services,
  resources,
  currentDate,
  onDateChange,
  onSelectBooking,
  onReschedule,
  onCancel,
  onNewBookingForDate,
}: BookingsCalendarViewProps) {
  const [mode, setMode] = useState<CalendarMode>('month');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const getServiceName = (serviceId: string) => {
    const s = services.find((item) => item.service_id === serviceId);
    return s?.name || 'Appointment';
  };

  const getResourceName = (booking: BookingInfo) => {
    const resId = booking.resource_id || (booking.resource_ids && booking.resource_ids[0]);
    if (!resId) return 'Auto-assigned Provider';
    const r = resources.find((item) => item.resource_id === resId);
    return r?.name || 'Staff';
  };

  const displayedBookings = useMemo(() => {
    if (selectedStaffId === 'all') return bookings;
    return bookings.filter((b) => {
      const bResId = b.resource_id || (b.resource_ids && b.resource_ids[0]);
      return bResId === selectedStaffId;
    });
  }, [bookings, selectedStaffId]);

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, BookingInfo[]>();
    displayedBookings.forEach((b) => {
      if (!b.start_time) return;
      const dateKey = b.start_time.split('T')[0];
      const list = map.get(dateKey) || [];
      list.push(b);
      map.set(dateKey, list);
    });

    map.forEach((list) => {
      list.sort((a, b) => (a.start_time > b.start_time ? 1 : -1));
    });

    return map;
  }, [displayedBookings]);

  const handlePrev = () => {
    if (mode === 'month') {
      onDateChange(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      onDateChange(d);
    }
  };

  const handleNext = () => {
    if (mode === 'month') {
      onDateChange(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      onDateChange(d);
    }
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const headerTitle = useMemo(() => {
    if (mode === 'month') {
      return currentDate.toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      });
    }

    const curr = new Date(currentDate);
    const day = curr.getDay();
    const diff = (day + 6) % 7;
    const monday = new Date(curr);
    monday.setDate(curr.getDate() - diff);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const mLabel = monday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const sLabel = sunday.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return `${mLabel} – ${sLabel}`;
  }, [currentDate, mode]);

  const monthCells = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sun
    const startOffset = (firstDayIndex + 6) % 7; // 0 for Mon
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: Array<{
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      dateObj: Date;
    }> = [];

    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      const day = prevMonthTotalDays - i;
      const d = new Date(year, month - 1, day);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dateStr = `${y}-${m}-${String(day).padStart(2, '0')}`;
      cells.push({
        dateStr,
        dayNum: day,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        dateObj: d,
      });
    }

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const d = new Date(year, month, day);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dateStr = `${y}-${m}-${String(day).padStart(2, '0')}`;
      cells.push({
        dateStr,
        dayNum: day,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        dateObj: d,
      });
    }

    const remaining = (7 - (cells.length % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
      const d = new Date(year, month + 1, day);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dateStr = `${y}-${m}-${String(day).padStart(2, '0')}`;
      cells.push({
        dateStr,
        dayNum: day,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        dateObj: d,
      });
    }

    return cells;
  }, [currentDate, todayStr]);

  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const day = curr.getDay();
    const diff = (day + 6) % 7;
    const monday = new Date(curr);
    monday.setDate(curr.getDate() - diff);

    const days: Array<{
      dateStr: string;
      dayNum: number;
      dayName: string;
      isToday: boolean;
      dateObj: Date;
    }> = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = d.getDate();
      const dateStr = `${y}-${m}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNum,
        dayName: d.toLocaleDateString(undefined, { weekday: 'short' }),
        isToday: dateStr === todayStr,
        dateObj: d,
      });
    }

    return days;
  }, [currentDate, todayStr]);

  const formatSlotTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100/70';
      case 'pending':
        return 'bg-amber-50 text-amber-800 border-amber-200/80 hover:bg-amber-100/70';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200/70 line-through opacity-60 hover:opacity-100';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/60';
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs p-5 sm:p-6 flex flex-col gap-5">
      {/* Calendar Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{headerTitle}</h2>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-500" />}
          <button
            type="button"
            onClick={handleToday}
            className="px-3 py-1 bg-slate-100 hover:bg-slate-200/80 rounded-full text-xs font-semibold text-slate-700 transition cursor-pointer"
          >
            Today
          </button>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Staff Filter */}
          <div className="relative">
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="all">All Providers / Staff</option>
              {resources.map((res) => (
                <option key={res.resource_id} value={res.resource_id}>
                  {res.name}
                </option>
              ))}
            </select>
            <Users className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Mode Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setMode('month')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                mode === 'month'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setMode('week')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                mode === 'week'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Week
            </button>
          </div>

          {/* Prev/Next arrows */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Column Headers */}
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
        <div>Sun</div>
      </div>

      {/* Calendar Grid (Month or Week) */}
      {mode === 'month' ? (
        <div className="grid grid-cols-7 gap-2">
          {monthCells.map((cell) => {
            const dayBookings = bookingsByDate.get(cell.dateStr) || [];

            return (
              <div
                key={cell.dateStr}
                className={`min-h-[110px] sm:min-h-[125px] p-2 rounded-2xl border transition-all flex flex-col justify-between group ${
                  cell.isToday
                    ? 'bg-slate-50 border-slate-900/30 ring-1 ring-slate-900/10'
                    : cell.isCurrentMonth
                      ? 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-2xs'
                      : 'bg-slate-50/40 border-slate-100 opacity-50'
                }`}
              >
                {/* Cell Header: Day Number + Add Button */}
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                      cell.isToday
                        ? 'bg-slate-900 text-white font-extrabold'
                        : cell.isCurrentMonth
                          ? 'text-slate-800'
                          : 'text-slate-400'
                    }`}
                  >
                    {cell.dayNum}
                  </span>

                  {onNewBookingForDate && cell.isCurrentMonth && (
                    <button
                      type="button"
                      title="New Booking on this date"
                      onClick={() => onNewBookingForDate(cell.dateStr)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Day Bookings List */}
                <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[85px] pr-0.5">
                  {dayBookings.slice(0, 3).map((b) => {
                    const time = formatSlotTime(b.start_time);
                    const svc = getServiceName(b.service_id);
                    const cust = b.customer?.name || 'Customer';

                    return (
                      <div
                        key={b.booking_id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectBooking(b);
                        }}
                        title={`${time} - ${cust} (${svc})`}
                        className={`text-[11px] p-1.5 rounded-lg border font-medium truncate cursor-pointer transition shadow-2xs flex items-center justify-between gap-1 ${getStatusStyle(
                          b.status,
                        )}`}
                      >
                        <div className="truncate flex items-center gap-1">
                          <span className="font-bold shrink-0">{time}</span>
                          <span className="truncate">{cust}</span>
                        </div>
                        <span className="text-[9px] uppercase font-bold shrink-0 opacity-70">
                          {b.status === 'confirmed' ? '✓' : b.status === 'cancelled' ? '✕' : '•'}
                        </span>
                      </div>
                    );
                  })}

                  {dayBookings.length > 3 && (
                    <div
                      onClick={() => onSelectBooking(dayBookings[3])}
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-900 p-1 text-center bg-slate-100/70 hover:bg-slate-200/60 rounded-md cursor-pointer transition"
                    >
                      +{dayBookings.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Week View Grid */
        <div className="grid grid-cols-7 gap-2 min-h-[450px]">
          {weekDays.map((col) => {
            const dayBookings = bookingsByDate.get(col.dateStr) || [];

            return (
              <div
                key={col.dateStr}
                className={`p-3 rounded-2xl border flex flex-col gap-2.5 transition ${
                  col.isToday
                    ? 'bg-slate-50/80 border-slate-900/40 ring-1 ring-slate-900/10'
                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* Header */}
                <div className="flex flex-col items-center justify-center pb-2 border-b border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {col.dayName}
                  </span>
                  <span
                    className={`text-base font-extrabold mt-0.5 w-8 h-8 rounded-full flex items-center justify-center ${
                      col.isToday ? 'bg-slate-900 text-white' : 'text-slate-900'
                    }`}
                  >
                    {col.dayNum}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold mt-0.5">
                    {dayBookings.length} {dayBookings.length === 1 ? 'session' : 'sessions'}
                  </span>
                </div>

                {/* Bookings column */}
                <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-[380px] pr-0.5">
                  {dayBookings.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center text-slate-400 text-xs py-8">
                      No sessions
                    </div>
                  ) : (
                    dayBookings.map((b) => {
                      const time = formatSlotTime(b.start_time);
                      const svc = getServiceName(b.service_id);
                      const staff = getResourceName(b);
                      const cust = b.customer?.name || 'Customer';

                      const isCancelled = b.status === 'cancelled';
                      const isCompleted = b.status === 'completed';
                      const canModify = !isCancelled && !isCompleted;

                      return (
                        <div
                          key={b.booking_id}
                          onClick={() => onSelectBooking(b)}
                          className={`p-2.5 rounded-xl border text-xs flex flex-col gap-1.5 transition cursor-pointer shadow-2xs ${getStatusStyle(
                            b.status,
                          )}`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 shrink-0" />
                              {time}
                            </span>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-full bg-white/70">
                              {b.status}
                            </span>
                          </div>

                          <div className="font-semibold truncate text-slate-900">{cust}</div>
                          <div className="text-[11px] truncate opacity-80">{svc}</div>
                          <div className="text-[10px] text-slate-500 font-medium truncate">
                            Staff: {staff}
                          </div>

                          {canModify && (
                            <div
                              className="pt-1.5 mt-0.5 border-t border-black/5 flex items-center justify-end gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                title="Reschedule"
                                onClick={() => onReschedule(b)}
                                className="p-1 hover:bg-black/10 rounded transition text-slate-700 cursor-pointer"
                              >
                                <RefreshCw className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                title="Cancel"
                                onClick={() => onCancel(b)}
                                className="p-1 hover:bg-rose-100 rounded transition text-rose-700 cursor-pointer"
                              >
                                <CalendarX className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
