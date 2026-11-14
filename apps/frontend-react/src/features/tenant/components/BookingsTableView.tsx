import type { BookingInfo, ResourceInfo, ServiceInfo } from '@repo/proto/scheduling';
import {
  Bot,
  CalendarDays,
  CalendarX,
  CheckCircle2,
  Clock,
  Eye,
  Globe,
  Loader2,
  PhoneCall,
  RefreshCw,
  User,
} from 'lucide-react';
import { TablePaginationFooter } from '../../../components/TablePaginationFooter';

interface BookingsTableViewProps {
  bookings: BookingInfo[];
  isLoading: boolean;
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
  onSelectBooking: (booking: BookingInfo) => void;
  onReschedule: (booking: BookingInfo) => void;
  onCancel: (booking: BookingInfo) => void;
  onComplete?: (booking: BookingInfo) => void;
  services: ServiceInfo[];
  resources: ResourceInfo[];
}

export function BookingsTableView({
  bookings,
  isLoading,
  pagination,
  onPageChange,
  onLimitChange,
  onSelectBooking,
  onReschedule,
  onCancel,
  onComplete,
  services,
  resources,
}: BookingsTableViewProps) {
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));
  const currentPage = pagination.page;

  const getServiceName = (serviceId: string) => {
    const s = services.find((item) => item.service_id === serviceId);
    return s?.name || 'Scheduled Service';
  };

  const getResourceName = (booking: BookingInfo) => {
    const resId = booking.resource_id || (booking.resource_ids && booking.resource_ids[0]);
    if (!resId) return 'Auto-assigned Provider';
    const r = resources.find((item) => item.resource_id === resId);
    return r?.name || 'Assigned Staff';
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return { date: 'N/A', time: 'N/A' };
    try {
      const d = new Date(isoString);
      const date = d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const time = d.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      return { date, time };
    } catch {
      return { date: isoString, time: '' };
    }
  };

  const formatSource = (source?: string) => {
    switch (source) {
      case 'customer_agent':
        return {
          label: 'AI Agent',
          icon: <PhoneCall className="w-3 h-3 text-indigo-600" />,
        };
      case 'sandbox_simulation':
        return {
          label: 'Sandbox Simulation',
          icon: <Bot className="w-3 h-3 text-purple-600" />,
        };
      case 'web_portal':
        return {
          label: 'Web Embed',
          icon: <Globe className="w-3 h-3 text-blue-600" />,
        };
      default:
        return {
          label: 'Manual',
          icon: <User className="w-3 h-3 text-slate-500" />,
        };
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden flex flex-col">
      {/* Mobile Card List View (< md) */}
      <div className="md:hidden divide-y divide-slate-100 min-h-[250px]">
        {isLoading ? (
          <div className="py-16 text-center text-slate-500">
            <div className="flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-slate-700" />
              <span className="font-medium text-xs text-slate-500">Loading appointments...</span>
            </div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-16 text-center text-slate-400 p-4">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                <CalendarDays className="w-5 h-5" />
              </div>
              <span className="font-medium text-slate-600 text-sm">No bookings found</span>
              <span className="text-xs text-slate-400 max-w-xs mx-auto">
                Try adjusting your search criteria, status filter, or create a new booking.
              </span>
            </div>
          </div>
        ) : (
          bookings.map((booking) => {
            const { date, time } = formatDate(booking.start_time);
            const source = formatSource(booking.source);
            const serviceName = getServiceName(booking.service_id);
            const staffName = getResourceName(booking);

            const isCancelled = booking.status === 'cancelled';
            const isCompleted = booking.status === 'completed';
            const canModify = !isCancelled && !isCompleted;

            return (
              <div
                key={booking.booking_id}
                onClick={() => onSelectBooking(booking)}
                className="p-4 flex flex-col gap-3 hover:bg-slate-50/80 transition-colors cursor-pointer"
              >
                {/* Header: Customer + Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {booking.customer?.name
                        ? booking.customer.name.charAt(0).toUpperCase()
                        : 'C'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-sm truncate">
                        {booking.customer?.name || 'Customer'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">
                        {booking.booking_reference || booking.booking_id.slice(-6).toUpperCase()}
                        {booking.customer?.phone && ` • ${booking.customer.phone}`}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {booking.status === 'confirmed' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Confirmed
                      </span>
                    )}
                    {booking.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Pending
                      </span>
                    )}
                    {booking.status === 'completed' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200/60">
                        Completed
                      </span>
                    )}
                    {booking.status === 'cancelled' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
                        Cancelled
                      </span>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="bg-slate-50/80 rounded-xl p-3 flex flex-col gap-1.5 text-xs border border-slate-100">
                  <div className="flex items-center justify-between font-semibold text-slate-800">
                    <span className="truncate">{serviceName}</span>
                    <span className="font-mono text-emerald-700 shrink-0">
                      {booking.price?.amount ? `$${booking.price.amount}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {date} at {time}
                    </span>
                    <span className="truncate">Staff: {staffName}</span>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div
                  className="flex items-center justify-between pt-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                    {source.icon}
                    <span>{source.label}</span>
                  </span>

                  <div className="flex items-center gap-1">
                    {canModify && (
                      <>
                        {onComplete && booking.status !== 'completed' && (
                          <button
                            type="button"
                            title="Mark as Completed"
                            onClick={() => onComplete(booking)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          title="Reschedule Booking"
                          onClick={() => onReschedule(booking)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Cancel Booking"
                          onClick={() => onCancel(booking)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <CalendarX className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      title="View Details"
                      onClick={() => onSelectBooking(booking)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table View (>= md) */}
      <div className="hidden md:block overflow-x-auto min-h-[300px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-5">Booking Ref & Customer</th>
              <th className="py-3.5 px-5">Service</th>
              <th className="py-3.5 px-5">Scheduled For</th>
              <th className="py-3.5 px-5">Staff / Provider</th>
              <th className="py-3.5 px-5">Source</th>
              <th className="py-3.5 px-5">Status</th>
              <th className="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-700" />
                    <span className="font-medium text-xs text-slate-500">
                      Loading appointments...
                    </span>
                  </div>
                </td>
              </tr>
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                      <CalendarDays className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-slate-600 text-sm">No bookings found</span>
                    <span className="text-xs text-slate-400 max-w-xs">
                      Try adjusting your search criteria, status filter, or create a new booking.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              bookings.map((booking) => {
                const { date, time } = formatDate(booking.start_time);
                const source = formatSource(booking.source);
                const serviceName = getServiceName(booking.service_id);
                const staffName = getResourceName(booking);

                const isCancelled = booking.status === 'cancelled';
                const isCompleted = booking.status === 'completed';
                const canModify = !isCancelled && !isCompleted;

                return (
                  <tr
                    key={booking.booking_id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => onSelectBooking(booking)}
                  >
                    {/* Booking ID & Customer */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {booking.customer?.name
                            ? booking.customer.name.charAt(0).toUpperCase()
                            : 'C'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {booking.customer?.name || 'Customer'}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                            <span className="text-slate-600 font-semibold">
                              {booking.booking_reference ||
                                booking.booking_id.slice(-6).toUpperCase()}
                            </span>
                            {booking.customer?.phone && <span>• {booking.customer.phone}</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Service */}
                    <td className="py-4 px-5">
                      <div className="font-semibold text-slate-800">{serviceName}</div>
                      <div className="text-[11px] text-slate-400">
                        {booking.duration_minutes || 60} mins
                        {booking.price?.amount ? ` • $${booking.price.amount}` : ''}
                      </div>
                    </td>

                    {/* Date & Time */}
                    <td className="py-4 px-5">
                      <div className="font-medium text-slate-800">{date}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{time}</div>
                    </td>

                    {/* Staff / Resource */}
                    <td className="py-4 px-5 font-medium text-slate-700">{staffName}</td>

                    {/* Channel Source */}
                    <td className="py-4 px-5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/50">
                        {source.icon}
                        <span>{source.label}</span>
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-5">
                      {booking.status === 'confirmed' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Confirmed
                        </span>
                      )}
                      {booking.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Pending
                        </span>
                      )}
                      {booking.status === 'completed' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200/60">
                          Completed
                        </span>
                      )}
                      {booking.status === 'cancelled' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
                          Cancelled
                        </span>
                      )}
                    </td>

                    {/* Action dropdown */}
                    <td className="py-4 px-5 text-right relative">
                      <div
                        className="inline-flex items-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {canModify && (
                          <>
                            {onComplete && booking.status !== 'completed' && (
                              <button
                                type="button"
                                title="Mark as Completed"
                                onClick={() => onComplete(booking)}
                                className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              title="Reschedule Booking"
                              onClick={() => onReschedule(booking)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Cancel Booking"
                              onClick={() => onCancel(booking)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <CalendarX className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          title="View Details"
                          onClick={() => onSelectBooking(booking)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <TablePaginationFooter
        currentPage={currentPage}
        totalCount={pagination.total}
        pageSize={pagination.limit}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
        isLoading={isLoading}
        entityName="bookings"
      />
    </div>
  );
}
