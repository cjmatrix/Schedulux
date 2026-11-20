import type { BookingInfo } from '@repo/proto/scheduling';
import {
  AlertCircle,
  Bot,
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
import { useParams, useSearchParams } from 'react-router';
import useDebounceHook from '../../../shared/hooks/useDebounceHook';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { BookingDetailsModal } from '../components/BookingDetailsModal';
import { BookingsCalendarView } from '../components/BookingsCalendarView';
import { BookingsTableView } from '../components/BookingsTableView';
import { CancelBookingModal } from '../components/CancelBookingModal';
import { CreateBookingModal } from '../components/CreateBookingModal';
import { RescheduleBookingModal } from '../components/RescheduleBookingModal';
import { useBookingsList, useCompleteBooking } from '../hooks/useBookings';
import { useTenantAgents } from '../hooks/useKnowledgeDocuments';
import { useResourcesList, useServicesList } from '../hooks/useServices';

export default function BookingsPage() {
  const { user: authUser, isManager } = useCurrentUser();
  const { agentId: routeAgentId } = useParams<{ agentId?: string }>();
  const [searchParams] = useSearchParams();
  const queryAgentId = searchParams.get('agent_id');
  const { data: agents = [] } = useTenantAgents();

  const activeAgentId =
    (isManager && authUser?.agent_id)
      ? authUser.agent_id
      : routeAgentId || queryAgentId || (agents.length > 0 ? agents[0].agent_id : undefined);

  const currentEffectiveAgentId = activeAgentId;

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
  }, [debouncedSearch, statusFilter, activeAgentId]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const calendarRange = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const startOffset = (firstDayIndex + 6) % 7;
    const gridStartDate = new Date(year, month, 1 - startOffset, 0, 0, 0, 0);
    const totalDays = new Date(year, month + 1, 0).getDate();
    const lastDayIndex = new Date(year, month, totalDays).getDay();
    const endOffset = (7 - ((lastDayIndex + 6) % 7) - 1 + 7) % 7;
    const gridEndDate = new Date(year, month, totalDays + endOffset, 23, 59, 59, 999);

    return {
      startDate: gridStartDate.toISOString(),
      endDate: gridEndDate.toISOString(),
    };
  }, [calendarDate]);

  const queryParams = useMemo(() => {
    if (viewMode === 'calendar') {
      return {
        agent_id: activeAgentId,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: debouncedSearch.trim() || undefined,
        start_date: calendarRange.startDate,
        end_date: calendarRange.endDate,
        limit: 1000,
        page: 1,
      };
    }

    return {
      page,
      limit,
      agent_id: activeAgentId,
      status: statusFilter === 'all' ? undefined : statusFilter,
      search: debouncedSearch.trim() || undefined,
    };
  }, [viewMode, calendarRange, activeAgentId, statusFilter, debouncedSearch, page, limit]);

  const {
    data: bookingsResponse,
    isLoading: isBookingsLoading,
    refetch: refetchBookings,
  } = useBookingsList(queryParams);

  const { data: servicesResponse } = useServicesList(
    {
      agent_id: currentEffectiveAgentId,
      limit: 100,
    },
    { enabled: true },
  );

  const { data: resourcesResponse } = useResourcesList(
    {
      agent_id: currentEffectiveAgentId,
      limit: 100,
    },
    { enabled: true },
  );

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

  const summary = bookingsResponse?.summary;

  const metrics = useMemo(() => {
    const total = summary?.total_count ?? pagination.total;
    const confirmedCount =
      summary?.confirmed_count ?? bookings.filter((b) => b.status === 'confirmed').length;
    const pendingCount =
      summary?.pending_count ?? bookings.filter((b) => b.status === 'pending').length;
    const aiBookedCount =
      summary?.ai_inbound_count ?? bookings.filter((b) => b.source === 'customer_agent').length;

    const aiPercent =
      summary?.ai_inbound_percent ??
      (bookings.length > 0 ? Math.round((aiBookedCount / bookings.length) * 100) : 0);

    return {
      total,
      confirmedCount,
      pendingCount,
      aiBookedCount,
      aiPercent,
    };
  }, [summary, pagination.total, bookings]);

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

  const completeMutation = useCompleteBooking();

  const handleBookingCompleted = (booking: BookingInfo) => {
    const ref = booking.booking_reference || booking.booking_id.slice(-6).toUpperCase();
    completeMutation.mutate(
      {
        bookingId: booking.booking_id,
        agentId: booking.agent_id || currentEffectiveAgentId || '',
      },
      {
        onSuccess: () => {
          showToast(`Appointment ${ref} marked as completed!`);
          setBookingForDetails(null);
          refetchBookings();
        },
        onError: (err: unknown) => {
          showToast(err instanceof Error ? err.message : 'Failed to complete booking.');
        },
      },
    );
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto flex flex-col gap-6 sm:gap-8 font-sans">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 tracking-wide">
        <span>Operations</span>
        <span>/</span>
        <span className="text-slate-800">Calendar &amp; Bookings</span>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 sm:pb-6 border-b border-slate-200">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 tracking-tight truncate">
              Calendar &amp; Bookings
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold shrink-0">
              {pagination.total} Total
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Manage real-time appointments, live calendar views, rescheduling, and cancellations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center bg-white border border-slate-200/90 rounded-full p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              List View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Calendar View
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsNewBookingModalOpen(true)}
            className="px-4 sm:px-5 py-2 sm:py-2.5 bg-slate-950 hover:bg-black text-white text-xs font-semibold rounded-full flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Booking</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-slate-400 truncate">
              Total Bookings
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 shrink-0">
              <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-1 flex-wrap">
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {metrics.total}
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Live DB
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-slate-400 truncate">
              AI Inbound
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-1 flex-wrap">
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {metrics.aiBookedCount}
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              {metrics.aiPercent}% AI
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-slate-400 truncate">
              Confirmed
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-1 flex-wrap">
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {metrics.confirmedCount}
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500">Active</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-slate-400 truncate">
              Pending
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
              <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-1 flex-wrap">
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {metrics.pendingCount}
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full truncate">
              {metrics.pendingCount > 0 ? 'Action Req.' : 'All Clear'}
            </span>
          </div>
        </div>
      </div>

      {/* Control Bar (Search & Filter) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
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

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
          {activeAgentId && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200/80 truncate max-w-[200px]">
              <Bot className="w-3.5 h-3.5 text-slate-700 shrink-0" />
              <span className="truncate">{agents.find((a) => a.agent_id === activeAgentId)?.name || activeAgentId}</span>
            </div>
          )}

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
          onComplete={handleBookingCompleted}
          services={services}
          resources={resources}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {pagination.total >= 1000 && (
            <div className="p-3 bg-amber-50 border border-amber-200/80 text-amber-800 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                Showing the first 1,000 bookings for this period. Use the staff filter or switch to Week View for high-volume dates.
              </span>
            </div>
          )}
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
        </div>
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
        onComplete={handleBookingCompleted}
      />

      {/* Reschedule Booking Modal */}
      <RescheduleBookingModal
        isOpen={!!bookingToReschedule}
        onClose={() => setBookingToReschedule(null)}
        booking={bookingToReschedule}
        agentId={bookingToReschedule?.agent_id || currentEffectiveAgentId || ''}
        onSuccess={handleBookingRescheduled}
      />

      {/* Cancel Booking Modal */}
      <CancelBookingModal
        isOpen={!!bookingToCancel}
        onClose={() => setBookingToCancel(null)}
        booking={bookingToCancel}
        agentId={bookingToCancel?.agent_id || currentEffectiveAgentId || ''}
        onSuccess={handleBookingCancelled}
      />

      {/* Create Booking Modal */}
      <CreateBookingModal
        isOpen={isNewBookingModalOpen}
        onClose={() => setIsNewBookingModalOpen(false)}
        onBookingCreated={handleBookingCreated}
        agentId={currentEffectiveAgentId}
      />
    </div>
  );
}
