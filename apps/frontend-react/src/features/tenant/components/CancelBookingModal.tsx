import type { BookingInfo } from '@repo/proto/scheduling';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import React, { useState } from 'react';
import { useCancelBooking } from '../hooks/useBookings';

interface CancelBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingInfo | null;
  agentId: string;
  onSuccess?: () => void;
}

const CANCEL_REASONS = [
  'Customer requested cancellation',
  'Provider / Staff unavailable',
  'Scheduling conflict / Double booking',
  'Emergency or weather closure',
  'Customer did not show up',
  'Other reason',
];

export function CancelBookingModal({
  isOpen,
  onClose,
  booking,
  agentId,
  onSuccess,
}: CancelBookingModalProps) {
  const [selectedReason, setSelectedReason] = useState(CANCEL_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const cancelMutation = useCancelBooking();

  if (!isOpen || !booking) return null;

  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const finalReason =
      selectedReason === 'Other reason' ? customReason.trim() || 'Other reason' : selectedReason;

    cancelMutation.mutate(
      {
        bookingId: booking.booking_id,
        agentId,
        reason: finalReason,
      },
      {
        onSuccess: () => {
          onClose();
          onSuccess?.();
        },
        onError: (err: unknown) => {
          setErrorMsg(err instanceof Error ? err.message : 'Failed to cancel booking.');
        },
      },
    );
  };

  const bookingDate = booking.start_time
    ? new Date(booking.start_time).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  const bookingTime = booking.start_time
    ? new Date(booking.start_time).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={cancelMutation.isPending}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-100 cursor-pointer disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon & Title */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Cancel Appointment</h3>
            <p className="text-xs text-slate-500">
              Ref:{' '}
              <span className="font-mono font-semibold text-slate-700">
                {booking.booking_reference || booking.booking_id.slice(-6)}
              </span>
            </p>
          </div>
        </div>

        {/* Appointment Snapshot */}
        <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-3.5 mb-5 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-600">
            <span className="text-slate-400 font-medium">Customer:</span>
            <span className="font-semibold text-slate-800">
              {booking.customer?.name || 'Customer'}
            </span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span className="text-slate-400 font-medium">Scheduled For:</span>
            <span className="font-semibold text-slate-800">
              {bookingDate} at {bookingTime}
            </span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span className="text-slate-400 font-medium">Current Status:</span>
            <span className="font-semibold capitalize px-2 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700">
              {booking.status}
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleCancelSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Reason for Cancellation
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              disabled={cancelMutation.isPending}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent transition-all"
            >
              {CANCEL_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          {selectedReason === 'Other reason' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Specify Reason
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter details..."
                rows={2}
                disabled={cancelMutation.isPending}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent transition-all resize-none"
              />
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={cancelMutation.isPending}
              className="px-4 py-2.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Keep Booking
            </button>
            <button
              type="submit"
              disabled={cancelMutation.isPending}
              className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {cancelMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Confirm Cancellation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
