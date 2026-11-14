import type { BookingInfo, ResourceInfo, ServiceInfo } from '@repo/proto/scheduling';
import {
  CalendarDays,
  CalendarX,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

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
  const [selectedDateForDrawer, setSelectedDateForDrawer] = useState<string | null>(null);
  const [drawerSearch, setDrawerSearch] = useState<string>('');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedDateForDrawer(null);
      }
    };
    if (selectedDateForDrawer) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedDateForDrawer]);

  useEffect(() => {
    setDrawerSearch('');
  }, [selectedDateForDrawer]);

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

  const drawerBookings = useMemo(() => {
    if (!selectedDateForDrawer) return [];
    return bookingsByDate.get(selectedDateForDrawer) || [];
  }, [selectedDateForDrawer, bookingsByDate]);

  const filteredDrawerBookings = useMemo(() => {
    if (!drawerSearch.trim()) return drawerBookings;
    const term = drawerSearch.toLowerCase().trim();
    return drawerBookings.filter((b) => {
      const cust = (b.customer?.name || '').toLowerCase();
      const phone = (b.customer?.phone || '').toLowerCase();
      const email = (b.customer?.email || '').toLowerCase();
      const svc = getServiceName(b.service_id).toLowerCase();
      const staff = getResourceName(b).toLowerCase();
      const ref = (b.booking_reference || b.booking_id).toLowerCase();
      return (
        cust.includes(term) ||
        phone.includes(term) ||
        email.includes(term) ||
        svc.includes(term) ||
        staff.includes(term) ||
        ref.includes(term)
      );
    });
  }, [drawerBookings, drawerSearch, services, resources]);

  const formatDrawerDate = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'pending':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'completed':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200 line-through';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusCardStyle = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-50/20 border-emerald-200/60 hover:border-emerald-300';
      case 'pending':
        return 'bg-amber-50/20 border-amber-200/60 hover:border-amber-300';
      case 'completed':
        return 'bg-blue-50/20 border-blue-200/60 hover:border-blue-300';
      case 'cancelled':
        return 'bg-slate-50/60 border-slate-200/60 opacity-60';
      default:
        return 'bg-white border-slate-200 hover:border-slate-300';
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
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs p-3.5 sm:p-5 md:p-6 flex flex-col gap-4 sm:gap-5">
      {/* Calendar Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <h2 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight">{headerTitle}</h2>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-500 shrink-0" />}
          <button
            type="button"
            onClick={handleToday}
            className="px-2.5 sm:px-3 py-1 bg-slate-100 hover:bg-slate-200/80 rounded-full text-[11px] sm:text-xs font-semibold text-slate-700 transition cursor-pointer shrink-0"
          >
            Today
          </button>
        </div>

        <div className="flex items-center flex-wrap gap-2 justify-between sm:justify-end w-full sm:w-auto">
          {/* Staff Filter */}
          <div className="relative flex-1 sm:flex-initial min-w-[140px]">
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full sm:w-auto appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
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
          <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0">
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
          <div className="flex items-center gap-1 shrink-0">
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
      <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
        <div><span className="sm:hidden">M</span><span className="hidden sm:inline">Mon</span></div>
        <div><span className="sm:hidden">T</span><span className="hidden sm:inline">Tue</span></div>
        <div><span className="sm:hidden">W</span><span className="hidden sm:inline">Wed</span></div>
        <div><span className="sm:hidden">T</span><span className="hidden sm:inline">Thu</span></div>
        <div><span className="sm:hidden">F</span><span className="hidden sm:inline">Fri</span></div>
        <div><span className="sm:hidden">S</span><span className="hidden sm:inline">Sat</span></div>
        <div><span className="sm:hidden">S</span><span className="hidden sm:inline">Sun</span></div>
      </div>

      {/* Calendar Grid (Month or Week) */}
      {mode === 'month' ? (
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {monthCells.map((cell) => {
            const dayBookings = bookingsByDate.get(cell.dateStr) || [];

            return (
              <div
                key={cell.dateStr}
                onClick={() => {
                  if (dayBookings.length > 0) {
                    setSelectedDateForDrawer(cell.dateStr);
                  } else if (onNewBookingForDate && cell.isCurrentMonth) {
                    onNewBookingForDate(cell.dateStr);
                  }
                }}
                className={`min-h-[58px] sm:min-h-[125px] p-1 sm:p-2 rounded-xl sm:rounded-2xl border transition-all flex flex-col justify-between group cursor-pointer ${
                  cell.isToday
                    ? 'bg-slate-50 border-slate-900/30 ring-1 ring-slate-900/10'
                    : cell.isCurrentMonth
                      ? 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-2xs'
                      : 'bg-slate-50/40 border-slate-100 opacity-50'
                }`}
              >
                {/* Cell Header: Day Number + Add Button */}
                <div className="flex items-center justify-between mb-0.5 sm:mb-1.5">
                  <span
                    className={`text-[11px] sm:text-xs font-bold w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center ${
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
                      onClick={(e) => {
                        e.stopPropagation();
                        onNewBookingForDate(cell.dateStr);
                      }}
                      className="hidden sm:block opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Mobile-only booking indicator badge */}
                <div className="sm:hidden flex items-center justify-center py-1">
                  {dayBookings.length > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full text-[9px] font-bold bg-indigo-100 text-indigo-700">
                      {dayBookings.length}
                    </span>
                  )}
                </div>

                {/* Desktop Day Bookings List */}
                <div className="hidden sm:flex flex-1 flex-col gap-1 overflow-y-auto max-h-[85px] pr-0.5">
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
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDateForDrawer(cell.dateStr);
                      }}
                      className="text-[10px] font-bold text-slate-600 hover:text-slate-900 p-1 text-center bg-slate-100 hover:bg-slate-200/80 rounded-md cursor-pointer transition w-full"
                    >
                      +{dayBookings.length - 3} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Week View Grid with Mobile Snap-Scroll */
        <div className="flex sm:grid sm:grid-cols-7 gap-2 min-h-[450px] overflow-x-auto pb-2 snap-x snap-mandatory -mx-1 px-1 sm:mx-0 sm:px-0">
          {weekDays.map((col) => {
            const dayBookings = bookingsByDate.get(col.dateStr) || [];

            return (
              <div
                key={col.dateStr}
                className={`min-w-[260px] sm:min-w-0 snap-center sm:snap-align-none shrink-0 sm:shrink flex-1 p-3 rounded-2xl border flex flex-col gap-2.5 transition ${
                  col.isToday
                    ? 'bg-slate-50/80 border-slate-900/40 ring-1 ring-slate-900/10'
                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* Header */}
                <div
                  className="flex flex-col items-center justify-center pb-2 border-b border-slate-100 cursor-pointer group/col hover:bg-slate-50/80 rounded-xl transition"
                  onClick={() => setSelectedDateForDrawer(col.dateStr)}
                  title="View full day timeline"
                >
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
                  <span className="text-[10px] text-slate-500 font-semibold mt-0.5 group-hover/col:text-slate-900 transition">
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

      {/* Day Schedule Slide-Over Drawer (Option A - Shadcn Sheet Architecture) */}
      {selectedDateForDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setSelectedDateForDrawer(null)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-full sm:max-w-md md:max-w-lg bg-white shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-300 font-sans">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-slate-700" />
                  <h3 className="text-base font-bold text-slate-900">
                    {formatDrawerDate(selectedDateForDrawer)}
                  </h3>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-800 text-[11px] font-bold">
                    {drawerBookings.length} {drawerBookings.length === 1 ? 'Appointment' : 'Appointments'}
                  </span>
                  {selectedDateForDrawer === todayStr && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider">
                      Today
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onNewBookingForDate && (
                  <button
                    type="button"
                    onClick={() => {
                      onNewBookingForDate(selectedDateForDrawer);
                    }}
                    className="px-3 py-1.5 bg-slate-950 hover:bg-black text-white rounded-full text-xs font-semibold flex items-center gap-1 shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Booking</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedDateForDrawer(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* In-Drawer Search Filter (if > 4 bookings) */}
            {drawerBookings.length > 4 && (
              <div className="p-3 border-b border-slate-100 bg-white">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter by customer, staff, or service..."
                    value={drawerSearch}
                    onChange={(e) => setDrawerSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200/90 rounded-full focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>
            )}

            {/* Drawer Body (Timeline List) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-3">
              {filteredDrawerBookings.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  {drawerSearch ? 'No appointments match your search' : 'No appointments scheduled for this date.'}
                </div>
              ) : (
                filteredDrawerBookings.map((b) => {
                  const time = formatSlotTime(b.start_time);
                  const endTime = b.end_time ? formatSlotTime(b.end_time) : '';
                  const svc = getServiceName(b.service_id);
                  const staff = getResourceName(b);
                  const cust = b.customer?.name || 'Customer';
                  const phone = b.customer?.phone || '';
                  const isCancelled = b.status === 'cancelled';
                  const isCompleted = b.status === 'completed';
                  const canModify = !isCancelled && !isCompleted;

                  return (
                    <div
                      key={b.booking_id}
                      onClick={() => {
                        onSelectBooking(b);
                      }}
                      className={`p-4 rounded-2xl border transition-all hover:shadow-xs cursor-pointer flex flex-col gap-2.5 ${getStatusCardStyle(
                        b.status,
                      )}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>
                            {time}
                            {endTime ? ` – ${endTime}` : ''}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusBadgeStyle(
                            b.status,
                          )}`}
                        >
                          {b.status}
                        </span>
                      </div>

                      <div>
                        <div className="font-bold text-sm text-slate-900">{cust}</div>
                        <div className="text-xs text-slate-600 font-medium">{svc}</div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-600">Staff: {staff}</span>
                          {phone && (
                            <span className="text-slate-400 font-mono text-[11px]">• {phone}</span>
                          )}
                        </div>

                        {canModify && (
                          <div
                            className="flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => onReschedule(b)}
                              className="px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 rounded-md transition cursor-pointer"
                            >
                              Reschedule
                            </button>
                            <button
                              type="button"
                              onClick={() => onCancel(b)}
                              className="px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
