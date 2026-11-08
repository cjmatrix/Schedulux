import type { JSX } from 'preact';
import { useRef } from 'preact/hooks';
import { SendIcon } from '../icons';

interface WidgetInputProps {
  input: string;
  setInput: (value: string) => void;
  onSend: (text: string) => void;
  disabled: boolean;
  placeholder?: string;
}

export function WidgetInput({
  input,
  setInput,
  onSend,
  disabled,
  placeholder = 'Type a message or ask a question...',
}: WidgetInputProps): JSX.Element {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: JSX.TargetedKeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const trimmed = input.trim();
      if (trimmed && !disabled) {
        onSend(trimmed);
        setInput('');
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    }
  };

  const handleInput = (e: JSX.TargetedEvent<HTMLTextAreaElement, Event>) => {
    const val = (e.target as HTMLTextAreaElement).value;
    setInput(val);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 80)}px`;
    }
  };

  const handleButtonClick = () => {
    const trimmed = input.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const canSend = Boolean(input.trim()) && !disabled;

  return (
    <div className="schedulux-footer">
      <div className="schedulux-input-box">
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="schedulux-textarea"
          aria-label="Chat input message"
        />
        <button
          type="button"
          onClick={handleButtonClick}
          disabled={!canSend}
          className="schedulux-send-btn"
          title="Send message"
          aria-label="Send message"
        >
          <SendIcon size={16} />
        </button>
      </div>
      <div className="schedulux-powered-by">
        Powered by{' '}
        <a href="https://schedulux.ai" target="_blank" rel="noopener noreferrer">
          Schedulux AI
        </a>
      </div>
    </div>
  );
}
