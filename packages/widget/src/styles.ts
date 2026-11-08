import type { WidgetConfig, WidgetTheme } from './types';

export function getWidgetStyles(config?: Partial<WidgetConfig>, inline?: boolean): string {
  const theme: WidgetTheme = config?.theme || {};
  const primary = theme.primary_color || '#4F46E5';
  const secondary = theme.secondary_color || '#6366F1';
  const background = theme.background_color || '#FFFFFF';
  const headerBg = theme.header_background || primary;
  const headerText = theme.header_text_color || '#FFFFFF';
  const userBubbleBg = theme.user_bubble_bg || primary;
  const userBubbleText = theme.user_bubble_text || '#FFFFFF';
  const agentBubbleBg = theme.agent_bubble_bg || '#F3F4F6';
  const agentBubbleText = theme.agent_bubble_text || '#111827';
  const radius = theme.border_radius || '16px';
  const font =
    theme.font_family && theme.font_family !== 'inherit'
      ? theme.font_family
      : 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  const bottomSpacing = config?.bottom_spacing_px ?? 20;
  const sideSpacing = config?.side_spacing_px ?? 20;
  const position = config?.position || 'bottom-right';

  const isLeft = position.includes('left');
  const isTop = position.includes('top');

  return `
    :host {
      display: ${inline ? 'block' : 'contents'};
      width: 100%;
      height: 100%;
      min-height: 0;
      --schedulux-primary: ${primary};
      --schedulux-secondary: ${secondary};
      --schedulux-bg: ${background};
      --schedulux-header-bg: ${headerBg};
      --schedulux-header-text: ${headerText};
      --schedulux-user-bubble-bg: ${userBubbleBg};
      --schedulux-user-bubble-text: ${userBubbleText};
      --schedulux-agent-bubble-bg: ${agentBubbleBg};
      --schedulux-agent-bubble-text: ${agentBubbleText};
      --schedulux-radius: ${radius};
      --schedulux-font: ${font};
      --schedulux-pos-bottom: ${bottomSpacing}px;
      --schedulux-pos-side: ${sideSpacing}px;
      --schedulux-shadow: 0 12px 36px -4px rgba(0, 0, 0, 0.16), 0 4px 12px -2px rgba(0, 0, 0, 0.08);
      --schedulux-border: rgba(226, 232, 240, 0.8);
      font-family: var(--schedulux-font);
      box-sizing: border-box;
      -webkit-font-smoothing: antialiased;
      line-height: 1.5;
    }

    .schedulux-mount-root {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      min-height: 0;
      flex: 1 1 0%;
      overflow: hidden;
    }

    *, *::before, *::after {
      box-sizing: inherit;
      margin: 0;
      padding: 0;
    }

    .schedulux-root {
      position: ${inline ? 'relative' : 'fixed'};
      ${inline ? 'width: 100%; height: 100%; top: auto; bottom: auto; left: auto; right: auto;' : isTop ? 'top: var(--schedulux-pos-bottom);' : 'bottom: var(--schedulux-pos-bottom);'}
      ${inline ? '' : isLeft ? 'left: var(--schedulux-pos-side);' : 'right: var(--schedulux-pos-side);'}
      z-index: ${inline ? '1' : '2147483647'};
      display: flex;
      flex-direction: column;
      min-height: 0;
      ${inline ? 'align-items: stretch;' : isLeft ? 'align-items: flex-start;' : 'align-items: flex-end;'}
      pointer-events: ${inline ? 'auto' : 'none'};
    }

    .schedulux-root.is-inline {
      position: relative !important;
      width: 100% !important;
      height: 100% !important;
      min-height: 0 !important;
      top: auto !important;
      bottom: auto !important;
      left: auto !important;
      right: auto !important;
      align-items: stretch !important;
      pointer-events: auto !important;
      flex: 1 1 0% !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
    }

    .schedulux-root.is-inline .schedulux-window {
      width: 100% !important;
      max-width: 100% !important;
      height: 100% !important;
      max-height: 100% !important;
      min-height: 0 !important;
      margin-bottom: 0 !important;
      box-shadow: none !important;
      border: 1px solid var(--schedulux-border) !important;
      border-radius: var(--schedulux-radius) !important;
      opacity: 1 !important;
      transform: none !important;
      visibility: visible !important;
      flex: 1 1 0% !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
    }

    .schedulux-root.is-inline .schedulux-launcher {
      display: none !important;
    }

    .schedulux-root * {
      pointer-events: auto;
    }

    /* Floating Launcher Button */
    .schedulux-launcher {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: var(--schedulux-primary);
      color: #ffffff;
      border: none;
      border-radius: 9999px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      outline: none;
      user-select: none;
    }

    .schedulux-launcher:hover {
      transform: scale(1.05);
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.24);
      filter: brightness(1.06);
    }

    .schedulux-launcher:active {
      transform: scale(0.96);
    }

    .schedulux-launcher.style-bubble {
      width: 58px;
      height: 58px;
      padding: 0;
    }

    .schedulux-launcher.style-pill {
      height: 50px;
      padding: 0 20px;
      font-weight: 600;
      font-size: 14px;
    }

    .schedulux-launcher.style-bar {
      height: 44px;
      padding: 0 18px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 14px;
    }

    .schedulux-launcher-badge {
      position: absolute;
      top: -2px;
      right: -2px;
      width: 14px;
      height: 14px;
      background: #10B981;
      border: 2px solid #ffffff;
      border-radius: 50%;
    }

    /* Chat Window Container */
    .schedulux-window {
      position: relative;
      width: 380px;
      max-width: calc(100vw - 32px);
      height: 600px;
      max-height: calc(100vh - 100px);
      background: var(--schedulux-bg);
      border-radius: var(--schedulux-radius);
      box-shadow: var(--schedulux-shadow);
      border: 1px solid var(--schedulux-border);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      margin-bottom: 14px;
      opacity: 0;
      transform: translateY(16px) scale(0.96);
      transform-origin: ${isLeft ? 'bottom left' : 'bottom right'};
      transition: opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1), transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
      visibility: hidden;
    }

    .schedulux-window.is-open {
      opacity: 1;
      transform: translateY(0) scale(1);
      visibility: visible;
    }

    /* Header */
    .schedulux-header {
      background: var(--schedulux-header-bg);
      color: var(--schedulux-header-text);
      padding: 14px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top-left-radius: var(--schedulux-radius);
      border-top-right-radius: var(--schedulux-radius);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      flex-shrink: 0;
    }

    .schedulux-header-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }

    .schedulux-avatar {
      width: 38px;
      height: 38px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
      border: 1.5px solid rgba(255, 255, 255, 0.3);
    }

    .schedulux-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .schedulux-header-titles {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .schedulux-title-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .schedulux-header-title {
      font-weight: 700;
      font-size: 15px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .schedulux-status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10B981;
      display: inline-block;
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3);
      animation: schedulux-pulse 2s infinite;
    }

    .schedulux-header-subtitle {
      font-size: 11px;
      opacity: 0.85;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .schedulux-header-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .schedulux-header-btn {
      background: rgba(255, 255, 255, 0.15);
      border: none;
      color: var(--schedulux-header-text);
      width: 30px;
      height: 30px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.15s ease;
      outline: none;
    }

    .schedulux-header-btn:hover {
      background: rgba(255, 255, 255, 0.28);
    }

    /* Message Body / List */
    .schedulux-messages {
      flex: 1 1 0% !important;
      min-height: 0 !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .schedulux-messages::-webkit-scrollbar {
      width: 5px;
    }
    .schedulux-messages::-webkit-scrollbar-thumb {
      background: rgba(156, 163, 175, 0.4);
      border-radius: 4px;
    }

    .schedulux-load-older {
      display: flex;
      justify-content: center;
      padding: 4px 0 8px 0;
      flex-shrink: 0;
    }

    .schedulux-load-older-btn {
      font-size: 11px;
      font-weight: 600;
      color: #64748B;
      background: #F1F5F9;
      border: 1px solid #E2E8F0;
      border-radius: 9999px;
      padding: 4px 12px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .schedulux-load-older-btn:hover {
      background: #E2E8F0;
      color: #1E293B;
    }

    .schedulux-loading-older-text {
      font-size: 11px;
      color: #94A3B8;
      font-style: italic;
    }

    .schedulux-empty-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 24px 12px;
      color: #64748B;
      gap: 8px;
      margin: auto 0;
    }

    /* Bubbles */
    .schedulux-msg-row {
      display: flex;
      flex-direction: column;
      max-width: 85%;
      animation: schedulux-slide-up 0.2s ease-out;
    }

    .schedulux-msg-row.agent {
      align-self: flex-start;
    }

    .schedulux-msg-row.user {
      align-self: flex-end;
    }

    .schedulux-bubble {
      padding: 10px 14px;
      border-radius: 14px;
      font-size: 13.5px;
      line-height: 1.45;
      word-break: break-word;
      white-space: pre-wrap;
    }

    .schedulux-msg-row.agent .schedulux-bubble {
      background: var(--schedulux-agent-bubble-bg);
      color: var(--schedulux-agent-bubble-text);
      border-bottom-left-radius: 3px;
    }

    .schedulux-msg-row.user .schedulux-bubble {
      background: var(--schedulux-user-bubble-bg);
      color: var(--schedulux-user-bubble-text);
      border-bottom-right-radius: 3px;
    }

    .schedulux-msg-time {
      font-size: 10px;
      color: #94A3B8;
      margin-top: 3px;
      padding: 0 4px;
    }
    .schedulux-msg-row.user .schedulux-msg-time {
      text-align: right;
    }

    /* Booking Confirmation Card */
    .schedulux-booking-card {
      margin-top: 8px;
      background: #ECFDF5;
      border: 1px solid #A7F3D0;
      border-radius: 12px;
      padding: 12px 14px;
      color: #065F46;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .schedulux-booking-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 700;
      font-size: 13px;
    }

    .schedulux-booking-ref {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      background: rgba(6, 95, 70, 0.08);
      padding: 2px 6px;
      border-radius: 4px;
      display: inline-block;
      width: fit-content;
      font-weight: 600;
    }

    /* Quick Prompts Container */
    .schedulux-quick-prompts {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
    }

    .schedulux-prompt-chip {
      background: #F1F5F9;
      border: 1px solid #E2E8F0;
      color: #334155;
      font-size: 11.5px;
      font-weight: 500;
      padding: 6px 12px;
      border-radius: 9999px;
      cursor: pointer;
      transition: all 0.15s ease;
      text-align: left;
      outline: none;
    }

    .schedulux-prompt-chip:hover {
      background: var(--schedulux-primary);
      color: #ffffff;
      border-color: var(--schedulux-primary);
      transform: translateY(-1px);
    }

    /* Typing Indicator */
    .schedulux-typing {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 8px 12px;
      background: var(--schedulux-agent-bubble-bg);
      border-radius: 12px;
      width: fit-content;
      margin-bottom: 4px;
      align-self: flex-start;
    }

    .schedulux-typing-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #94A3B8;
      animation: schedulux-bounce 1.4s infinite ease-in-out both;
    }

    .schedulux-typing-dot:nth-child(1) { animation-delay: -0.32s; }
    .schedulux-typing-dot:nth-child(2) { animation-delay: -0.16s; }

    /* Footer Input Area */
    .schedulux-footer {
      border-top: 1px solid var(--schedulux-border);
      padding: 12px;
      background: var(--schedulux-bg);
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex-shrink: 0;
    }

    .schedulux-input-box {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 4px 6px 4px 12px;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    .schedulux-input-box:focus-within {
      border-color: var(--schedulux-primary);
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
    }

    .schedulux-textarea {
      flex: 1;
      border: none;
      background: transparent;
      outline: none;
      font-size: 13.5px;
      font-family: inherit;
      resize: none;
      max-height: 80px;
      min-height: 22px;
      line-height: 1.4;
      color: #1E293B;
    }

    .schedulux-textarea::placeholder {
      color: #94A3B8;
    }

    .schedulux-send-btn {
      background: var(--schedulux-primary);
      color: #ffffff;
      border: none;
      border-radius: 8px;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;
      outline: none;
      flex-shrink: 0;
    }

    .schedulux-send-btn:hover:not(:disabled) {
      filter: brightness(1.08);
      transform: scale(1.04);
    }

    .schedulux-send-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .schedulux-powered-by {
      font-size: 10px;
      color: #94A3B8;
      text-align: center;
      user-select: none;
    }
    .schedulux-powered-by a {
      color: #64748B;
      text-decoration: none;
      font-weight: 600;
    }
    .schedulux-powered-by a:hover {
      text-decoration: underline;
    }

    /* Keyframes */
    @keyframes schedulux-pulse {
      0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
      70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
      100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }

    @keyframes schedulux-bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }

    @keyframes schedulux-slide-up {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Responsive Mobile Screen */
    @media (max-width: 480px) {
      .schedulux-root {
        top: 0 !important;
        bottom: 0 !important;
        left: 0 !important;
        right: 0 !important;
      }
      .schedulux-window {
        width: 100vw !important;
        max-width: 100vw !important;
        height: 100% !important;
        max-height: 100% !important;
        border-radius: 0 !important;
        margin-bottom: 0 !important;
        border: none !important;
      }
      .schedulux-header {
        border-radius: 0 !important;
      }
    }
  `;
}
