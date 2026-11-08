import type { JSX } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { useWidgetChat } from '../hooks/useWidgetChat';
import type { WidgetConfig, WidgetInitOptions } from '../types';
import { MessageList } from './MessageList';
import { WidgetHeader } from './WidgetHeader';
import { WidgetInput } from './WidgetInput';
import { WidgetLauncher } from './WidgetLauncher';

interface ChatWidgetProps {
  options: WidgetInitOptions;
  config: Partial<WidgetConfig>;
}

function playChime() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Audio autoplay blocked or unsupported
  }
}

export function ChatWidget({ options, config }: ChatWidgetProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(Boolean(options.inline));
  const [input, setInput] = useState('');

  const {
    messages,
    isTyping,
    hasOlderMessages,
    isFetchingOlderMessages,
    loadOlderMessages,
    sendMessage,
    resetSession,
  } = useWidgetChat({ options, config });

  const quickPrompts = config.quick_prompts || [
    'What services do you provide?',
    'Check available appointment times',
    'What are your operating hours?',
  ];

  // Auto-expand timer
  useEffect(() => {
    if (config.auto_expand_delay_seconds && config.auto_expand_delay_seconds > 0) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, config.auto_expand_delay_seconds * 1000);
      return () => clearTimeout(timer);
    }
  }, [config.auto_expand_delay_seconds]);

  // Sound on load
  useEffect(() => {
    if (config.sound_on_load) {
      const timer = setTimeout(() => {
        playChime();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [config.sound_on_load]);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      options.onToggle?.(next);
      return next;
    });
  }, [options]);

  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isTyping) return;
      await sendMessage(text.trim());
      playChime();
    },
    [isTyping, sendMessage],
  );

  return (
    <div className={`schedulux-root ${options.inline ? 'is-inline' : ''}`}>
      <div className={`schedulux-window ${isOpen ? 'is-open' : ''}`}>
        <WidgetHeader
          config={config}
          onClose={() => setIsOpen(false)}
          onReset={resetSession}
          inline={options.inline}
        />
        <MessageList
          messages={messages}
          isTyping={isTyping}
          quickPrompts={quickPrompts}
          onSelectPrompt={handleSendMessage}
          hasOlderMessages={hasOlderMessages}
          isLoadingOlder={isFetchingOlderMessages}
          onLoadOlder={() => loadOlderMessages()}
        />
        <WidgetInput
          input={input}
          setInput={setInput}
          onSend={handleSendMessage}
          disabled={isTyping}
          placeholder={config.placeholder_text}
        />
      </div>

      {!options.inline && (
        <WidgetLauncher config={config} isOpen={isOpen} onToggle={handleToggle} />
      )}
    </div>
  );
}
