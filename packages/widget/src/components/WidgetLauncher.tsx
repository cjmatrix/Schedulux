import type { JSX } from 'preact';
import { CalendarIcon, ChatIcon, CloseIcon, HelpIcon } from '../icons';
import type { WidgetConfig } from '../types';

interface WidgetLauncherProps {
  config: Partial<WidgetConfig>;
  isOpen: boolean;
  onToggle: () => void;
}

export function WidgetLauncher({ config, isOpen, onToggle }: WidgetLauncherProps): JSX.Element {
  const style = config.launcher_style || 'bubble';
  const iconType = config.launcher_icon || 'chat';

  const renderIcon = () => {
    if (isOpen) {
      return <CloseIcon size={22} />;
    }
    switch (iconType) {
      case 'calendar':
        return <CalendarIcon size={22} />;
      case 'help':
        return <HelpIcon size={22} />;
      default:
        return <ChatIcon size={22} />;
    }
  };

  const labelText =
    config.launcher_style === 'pill' || config.launcher_style === 'bar'
      ? isOpen
        ? 'Close'
        : 'Book with AI'
      : null;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`schedulux-launcher style-${style}`}
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
    >
      {renderIcon()}
      {labelText && <span>{labelText}</span>}
      {!isOpen && <span className="schedulux-launcher-badge" />}
    </button>
  );
}
