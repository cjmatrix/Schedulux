import type { JSX } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import type { WidgetChatMessage } from '../types';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: WidgetChatMessage[];
  isTyping: boolean;
  quickPrompts?: string[];
  onSelectPrompt: (prompt: string) => void;
  hasOlderMessages?: boolean;
  isLoadingOlder?: boolean;
  onLoadOlder?: () => void;
}

export function MessageList({
  messages,
  isTyping,
  quickPrompts = [],
  onSelectPrompt,
  hasOlderMessages = false,
  isLoadingOlder = false,
  onLoadOlder,
}: MessageListProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevMessagesCountRef = useRef(messages.length);
  const prevScrollHeightRef = useRef(0);
  const isPrependingRef = useRef(false);

  useEffect(() => {
    const prevCount = prevMessagesCountRef.current;
    const currentCount = messages.length;
    prevMessagesCountRef.current = currentCount;

    if (isPrependingRef.current && containerRef.current) {
      const newScrollHeight = containerRef.current.scrollHeight;
      const heightDiff = newScrollHeight - prevScrollHeightRef.current;
      containerRef.current.scrollTop += heightDiff;
      isPrependingRef.current = false;
      return;
    }

    if (currentCount > prevCount || isTyping) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleScroll = (e: Event) => {
    const target = e.currentTarget as HTMLDivElement;
    if (target.scrollTop <= 20 && hasOlderMessages && !isLoadingOlder && onLoadOlder) {
      isPrependingRef.current = true;
      prevScrollHeightRef.current = target.scrollHeight;
      onLoadOlder();
    }
  };

  const handleManualLoad = () => {
    if (containerRef.current && hasOlderMessages && !isLoadingOlder && onLoadOlder) {
      isPrependingRef.current = true;
      prevScrollHeightRef.current = containerRef.current.scrollHeight;
      onLoadOlder();
    }
  };

  const showQuickPrompts = quickPrompts.length > 0 && messages.length <= 2;

  return (
    <div ref={containerRef} className="schedulux-messages" onScroll={handleScroll}>
      {hasOlderMessages && (
        <div className="schedulux-load-older">
          {isLoadingOlder ? (
            <span className="schedulux-loading-older-text">Loading earlier messages...</span>
          ) : (
            <button type="button" onClick={handleManualLoad} className="schedulux-load-older-btn">
              Load earlier messages
            </button>
          )}
        </div>
      )}

      {messages.map((msg, index) => (
        <MessageBubble key={msg.id || `msg_${index}`} message={msg} />
      ))}

      {showQuickPrompts && (
        <div className="schedulux-quick-prompts">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="schedulux-prompt-chip"
              onClick={() => onSelectPrompt(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {isTyping && (
        <div className="schedulux-typing">
          <span className="schedulux-typing-dot" />
          <span className="schedulux-typing-dot" />
          <span className="schedulux-typing-dot" />
        </div>
      )}

      <div ref={bottomRef} style={{ height: 1 }} />
    </div>
  );
}
