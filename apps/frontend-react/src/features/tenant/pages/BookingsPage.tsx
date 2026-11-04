import type { BookingInfo } from '@repo/proto/scheduling';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Filter,
  Plus,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import useDebounceHook from '../../../shared/hooks/useDebounceHook';
import { BookingDetailsModal } from '../components/BookingDetailsModal';
import { BookingsCalendarView } from '../components/BookingsCalendarView';
import { BookingsTableView } from '../components/BookingsTableView';
import { CancelBookingModal } from '../components/CancelBookingModal';
import { CreateBookingModal } from '../components/CreateBookingModal';
import { RescheduleBookingModal } from '../components/RescheduleBookingModal';
import { useBookingsList } from '../hooks/useBookings';
import { useResourcesList, useServicesList } from '../hooks/useServices';

export default function BookingsPage() {
  const { agentId } = useParams<{ agentId?: string }>();

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch] = useDebounceHook(searchTerm);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [calendarDate, setCalendarDate] = useState<Date>(() => new Date());

  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [bookingForDetails, setBookingForDetails] = useState<BookingInfo | null>(null);
  const [bookingToCancel, setBookingToCancel] = useState<BookingInfo | null>(null);
  const [bookingToReschedule, setBookingToReschedule] = useState<BookingInfo | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const queryParams = useMemo(() => {
    return {
      page,
      limit,
      agent_id: agentId,
      status: statusFilter === 'all' ? undefined : statusFilter,
      search: debouncedSearch.trim() || undefined,
    };
  }, [page, limit, agentId, statusFilter, debouncedSearch]);

  const {
    data: bookingsResponse,
    isLoading: isBookingsLoading,
    refetch: refetchBookings,
  } = useBookingsList(queryParams);

  const { data: servicesResponse } = useServicesList({
    agent_id: agentId,
    limit: 100,
  });

  const { data: resourcesResponse } = useResourcesList({
    agent_id: agentId,
    limit: 100,
  });

  const bookings = useMemo(() => bookingsResponse?.data || [], [bookingsResponse]);
  const pagination = useMemo(
    () =>
      bookingsResponse?.pagination || {
        total: bookings.length,
        page,
        limit,
      },
    [bookingsResponse, bookings.length, page, limit],
  );

  const services = useMemo(() => servicesResponse?.data || [], [servicesResponse]);
  const resources = useMemo(() => resourcesResponse?.data || [], [resourcesResponse]);

  const metrics = useMemo(() => {
    const total = pagination.total;
    const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
    const pendingCount = bookings.filter((b) => b.status === 'pending').length;
    const aiBookedCount = bookings.filter((b) => b.source === 'customer_agent').length;

    const aiPercent = bookings.length > 0 ? Math.round((aiBookedCount / bookings.length) * 100) : 0;

    return {
      total,
      confirmedCount,
      pendingCount,
      aiBookedCount,
      aiPercent,
    };
  }, [pagination.total, bookings]);

  const handleBookingCreated = (created: BookingInfo) => {
    const ref = created.booking_reference || created.booking_id.slice(-6).toUpperCase();
    const customer = created.customer?.name || 'Customer';
    showToast(`Booking ${ref} confirmed for ${customer}!`);
    refetchBookings();
  };

  const handleBookingCancelled = () => {
    if (bookingToCancel) {
      const ref =
        bookingToCancel.booking_reference || bookingToCancel.booking_id.slice(-6).toUpperCase();
      showToast(`Appointment ${ref} cancelled successfully.`);
    }
    setBookingToCancel(null);
    setBookingForDetails(null);
    refetchBookings();
  };

  const handleBookingRescheduled = () => {
    if (bookingToReschedule) {
      const ref =
        bookingToReschedule.booking_reference ||
        bookingToReschedule.booking_id.slice(-6).toUpperCase();
      showToast(`Appointment ${ref} rescheduled successfully!`);
    }
    setBookingToReschedule(null);
    setBookingForDetails(null);
    refetchBookings();
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto flex flex-col gap-6 font-sans">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 tracking-wide">
        <span>Operations</span>
        <span>/</span>
        <span className="text-slate-800">Calendar & Bookings</span>
      </div>

      {/* Success Notification Banner */}
      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-center justify-between text-xs text-emerald-800 font-semibold shadow-xs animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-emerald-500 hover:text-emerald-800 p-1 rounded-full cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Calendar & Bookings
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-200/70 text-slate-700 text-[10px] font-bold tracking-wider uppercase">
              {pagination.total} TOTAL SLOTS
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Manage real-time appointments, live calendar views, rescheduling, and cancellations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-white border border-slate-200/90 rounded-full p-1 shadow-2xs">
            {false&&<button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              List View
            </button>}
            {false&&<button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Calendar View
            </button>}
          </div>

          <button
            type="button"
            onClick={() => setIsNewBookingModalOpen(true)}
            className="px-5 py-2.5 bg-slate-950 hover:bg-black text-white text-xs font-semibold rounded-full flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Booking</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              Total Bookings
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {metrics.total}
            </span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Live DB
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              AI Inbound Booked
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {metrics.aiBookedCount}
            </span>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              {metrics.aiPercent}% Voice AI
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              Confirmed
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {metrics.confirmedCount}
            </span>
            <span className="text-xs font-semibold text-slate-500">Active</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              Pending Confirmation
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {metrics.pendingCount}
            </span>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              {metrics.pendingCount > 0 ? 'Action Required' : 'All Clear'}
            </span>
          </div>
        </div>
      </div>

      {/* Control Bar (Search & Filter) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer, booking ref, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200/90 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all shadow-2xs"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="appearance-none bg-white border border-slate-200/90 rounded-full px-4 py-2 pr-8 text-xs font-medium text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <Filter className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main View Display */}
      {viewMode === 'list' ? (
        <BookingsTableView
          bookings={bookings}
          isLoading={isBookingsLoading}
          pagination={pagination}
          onPageChange={(newPage) => setPage(newPage)}
          onLimitChange={(newLimit) => setLimit(newLimit)}
          onSelectBooking={(b) => setBookingForDetails(b)}
          onReschedule={(b) => setBookingToReschedule(b)}
          onCancel={(b) => setBookingToCancel(b)}
          services={services}
          resources={resources}
        />
      ) : (
        <BookingsCalendarView
          bookings={bookings}
          isLoading={isBookingsLoading}
          services={services}
          resources={resources}
          currentDate={calendarDate}
          onDateChange={(d) => setCalendarDate(d)}
          onSelectBooking={(b) => setBookingForDetails(b)}
          onReschedule={(b) => setBookingToReschedule(b)}
          onCancel={(b) => setBookingToCancel(b)}
          onNewBookingForDate={() => setIsNewBookingModalOpen(true)}
        />
      )}

      {/* Booking Details Modal */}
      <BookingDetailsModal
        isOpen={!!bookingForDetails}
        onClose={() => setBookingForDetails(null)}
        booking={bookingForDetails}
        services={services}
        resources={resources}
        onReschedule={(b) => setBookingToReschedule(b)}
        onCancel={(b) => setBookingToCancel(b)}
      />

      {/* Reschedule Booking Modal */}
      <RescheduleBookingModal
        isOpen={!!bookingToReschedule}
        onClose={() => setBookingToReschedule(null)}
        booking={bookingToReschedule}
        agentId={agentId || bookingToReschedule?.agent_id || ''}
        onSuccess={handleBookingRescheduled}
      />

      {/* Cancel Booking Modal */}
      <CancelBookingModal
        isOpen={!!bookingToCancel}
        onClose={() => setBookingToCancel(null)}
        booking={bookingToCancel}
        agentId={agentId || bookingToCancel?.agent_id || ''}
        onSuccess={handleBookingCancelled}
      />

      {/* Create Booking Modal */}
      <CreateBookingModal
        isOpen={isNewBookingModalOpen}
        onClose={() => setIsNewBookingModalOpen(false)}
        onBookingCreated={handleBookingCreated}
        agentId={agentId}
      />
    </div>
  );
}
