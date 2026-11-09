import type { JSX } from 'preact';
import { CheckCircleIcon } from '../icons';
import type { WidgetChatMessage } from '../types';

interface MessageBubbleProps {
  message: WidgetChatMessage;
}

function formatTime(isoString?: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function MessageBubble({ message }: MessageBubbleProps): JSX.Element {
  const isUser = message.role === 'user';
  const isPending = message.delivery_status === 'pending';
  const timeText = formatTime(message.created_at);

  return (
    <div
      className={`schedulux-msg-row ${isUser ? 'user' : 'agent'} ${isPending ? 'is-pending' : ''}`}
      style={isPending ? { opacity: 0.72 } : undefined}
    >
      <div className="schedulux-bubble">
        {message.content}
        {message.booking_reference && (
          <div className="schedulux-booking-card">
            <div className="schedulux-booking-header">
              <CheckCircleIcon size={16} />
              <span>Appointment Confirmed</span>
            </div>
            <div className="schedulux-booking-ref">Ref: {message.booking_reference}</div>
          </div>
        )}
      </div>
      <div className="schedulux-msg-time">
        {timeText}
        {isPending && ' • sending...'}
      </div>
    </div>
  );
}
