import type { JSX } from 'preact';
import { BotIcon, CloseIcon, RefreshIcon } from '../icons';
import type { WidgetConfig } from '../types';

interface WidgetHeaderProps {
  config: Partial<WidgetConfig>;
  onClose?: () => void;
  onReset: () => void;
  inline?: boolean;
}

export function WidgetHeader({
  config,
  onClose,
  onReset,
  inline = false,
}: WidgetHeaderProps): JSX.Element {
  const agentName = config.agent_name || 'AI Assistant';
  const agentSubtitle = config.agent_subtitle || 'Typically replies instantly';
  const avatarUrl = config.avatar_url || config.logo_url;

  return (
    <div className="schedulux-header">
      <div className="schedulux-header-brand">
        <div className="schedulux-avatar">
          {avatarUrl ? (
            <img src={avatarUrl} alt={agentName} />
          ) : (
            <BotIcon className="schedulux-avatar-icon" size={20} />
          )}
        </div>
        <div className="schedulux-header-titles">
          <div className="schedulux-title-row">
            <span className="schedulux-header-title">{agentName}</span>
            <span className="schedulux-status-dot" title="Live Agent Active" />
          </div>
          <span className="schedulux-header-subtitle">{agentSubtitle}</span>
        </div>
      </div>
      <div className="schedulux-header-actions">
        <button
          type="button"
          onClick={onReset}
          className="schedulux-header-btn"
          title="Reset conversation"
          aria-label="Reset conversation"
        >
          <RefreshIcon size={15} />
        </button>
        {!inline && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="schedulux-header-btn"
            title="Minimize chat"
            aria-label="Minimize chat"
          >
            <CloseIcon size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
