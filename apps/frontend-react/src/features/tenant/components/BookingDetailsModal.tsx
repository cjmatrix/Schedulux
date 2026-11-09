import type { BookingInfo, ResourceInfo, ServiceInfo } from '@repo/proto/scheduling';
import {
  Bot,
  CalendarX,
  Clock,
  Globe,
  Mail,
  Phone,
  PhoneCall,
  RefreshCw,
  Sparkles,
  User,
  X,
} from 'lucide-react';

interface BookingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingInfo | null;
  services: ServiceInfo[];
  resources: ResourceInfo[];
  onReschedule: (booking: BookingInfo) => void;
  onCancel: (booking: BookingInfo) => void;
}

export function BookingDetailsModal({
  isOpen,
  onClose,
  booking,
  services,
  resources,
  onReschedule,
  onCancel,
}: BookingDetailsModalProps) {
  if (!isOpen || !booking) return null;

  const matchedService = services.find((s) => s.service_id === booking.service_id);
  const serviceName = matchedService?.name || 'Scheduled Service';

  const resId = booking.resource_id || (booking.resource_ids && booking.resource_ids[0]);
  const matchedResource = resId ? resources.find((r) => r.resource_id === resId) : undefined;
  const staffName = matchedResource?.name || 'Auto-assigned Provider';

  const formatDate = (isoString?: string) => {
    if (!isoString) return { date: 'N/A', time: 'N/A' };
    try {
      const d = new Date(isoString);
      const date = d.toLocaleDateString(undefined, {
        weekday: 'short',
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

  const startFormatted = formatDate(booking.start_time);
  const endFormatted = formatDate(booking.end_time);

  const formatSource = (source?: string) => {
    switch (source) {
      case 'customer_agent':
        return {
          label: 'AI Voice Agent',
          icon: <PhoneCall className="w-3.5 h-3.5 text-indigo-600" />,
        };
      case 'sandbox_simulation':
        return {
          label: 'Sandbox Simulation',
          icon: <Bot className="w-3.5 h-3.5 text-purple-600" />,
        };
      case 'web_portal':
        return {
          label: 'Web Embed',
          icon: <Globe className="w-3.5 h-3.5 text-blue-600" />,
        };
      default:
        return {
          label: 'Manual',
          icon: <User className="w-3.5 h-3.5 text-slate-500" />,
        };
    }
  };

  const sourceInfo = formatSource(booking.source);
  const isCancelled = booking.status === 'cancelled';
  const isCompleted = booking.status === 'completed';
  const canModify = !isCancelled && !isCompleted;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold text-slate-400 font-mono tracking-wider">
              {booking.booking_reference || booking.booking_id.slice(-6).toUpperCase()}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize border ${
                booking.status === 'confirmed'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : booking.status === 'pending'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : booking.status === 'cancelled'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {booking.status}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-5 space-y-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">{serviceName}</h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {startFormatted.date} • {startFormatted.time} – {endFormatted.time} (
                {booking.duration_minutes || 60} mins)
              </span>
            </p>
          </div>

          {/* Customer Card */}
          <div className="bg-slate-50/80 rounded-2xl p-4 space-y-2 text-xs border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Customer Details
            </span>
            <div className="flex items-center gap-2.5 text-slate-800 font-semibold">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{booking.customer?.name || 'Customer'}</span>
            </div>
            {booking.customer?.phone && (
              <div className="flex items-center gap-2.5 text-slate-600 font-mono">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{booking.customer.phone}</span>
              </div>
            )}
            {booking.customer?.email && (
              <div className="flex items-center gap-2.5 text-slate-600">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{booking.customer.email}</span>
              </div>
            )}
          </div>

          {/* Service & Staff Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 border border-slate-100 rounded-xl bg-white shadow-2xs">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">
                Staff / Provider
              </span>
              <span className="font-semibold text-slate-800 mt-0.5 block">{staffName}</span>
            </div>

            <div className="p-3 border border-slate-100 rounded-xl bg-white shadow-2xs">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">
                Channel Source
              </span>
              <div className="flex items-center gap-1.5 mt-0.5 font-semibold text-slate-800">
                {sourceInfo.icon}
                <span>{sourceInfo.label}</span>
              </div>
            </div>
          </div>

          {/* Price / Deposit details */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 border border-slate-100 rounded-xl bg-white shadow-2xs">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Pricing</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">
                {booking.price?.amount
                  ? `$${booking.price.amount} ${booking.price.currency || 'USD'}`
                  : 'Free / Included'}
              </span>
            </div>

            <div className="p-3 border border-slate-100 rounded-xl bg-white shadow-2xs">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">
                Deposit Status
              </span>
              <span className="font-semibold text-slate-800 mt-0.5 block capitalize">
                {booking.deposit_status?.replace('_', ' ') || 'Not Required'}
              </span>
            </div>
          </div>

          {/* Notes */}
          {booking.notes && (
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Notes
              </span>
              <p className="text-slate-700 leading-relaxed">{booking.notes}</p>
            </div>
          )}

          {/* AI Transcript Summary if from voice agent or sandbox simulation */}
          {(booking.source === 'customer_agent' || booking.source === 'sandbox_simulation') && (
            <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-2xl text-xs text-indigo-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>AI Voice Assistant Interaction</span>
              </div>
              <p className="text-[11px] text-indigo-700 leading-relaxed">
                Customer connected via the inbound AI agent line. Automated natural language
                negotiation checked calendar availability and finalized this reservation.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2.5">
          {canModify ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onCancel(booking);
                }}
                className="px-4 py-2 rounded-full border border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <CalendarX className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReschedule(booking);
                }}
                className="px-4 py-2 rounded-full border border-indigo-200 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reschedule</span>
              </button>
            </div>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-semibold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
