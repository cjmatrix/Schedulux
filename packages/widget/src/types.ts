export interface WidgetTheme {
  primary_color?: string;
  secondary_color?: string;
  background_color?: string;
  header_background?: string;
  header_text_color?: string;
  user_bubble_bg?: string;
  user_bubble_text?: string;
  agent_bubble_bg?: string;
  agent_bubble_text?: string;
  border_radius?: string;
  font_family?: string;
  theme_mode?: 'light' | 'dark' | 'auto';
}

export interface WidgetConfig {
  agent_name?: string;
  agent_subtitle?: string;
  avatar_url?: string;
  logo_url?: string;
  initial_greeting?: string;
  placeholder_text?: string;
  quick_prompts?: string[];
  fallback_message?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  bottom_spacing_px?: number;
  side_spacing_px?: number;
  launcher_style?: 'bubble' | 'pill' | 'bar';
  launcher_icon?: 'chat' | 'calendar' | 'help';
  sound_on_load?: boolean;
  auto_expand_delay_seconds?: number;
  platform_sources?: string[];
  whitelisted_domains?: string[];
  theme?: WidgetTheme;
}

export interface WidgetChatMessage {
  id?: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  created_at?: string;
  booking_reference?: string;
  booking_id?: string;
  status?: string;
  delivery_status?: 'pending' | 'sent' | 'error';
}

export interface WidgetInitOptions {
  tenantId: string;
  agentId: string;
  apiBase?: string;
  container?: HTMLElement;
  inline?: boolean;
  config?: Partial<WidgetConfig>;
  mode?: 'live' | 'sandbox';
  customerName?: string;
  customerPhone?: string;
  initialMessages?: WidgetChatMessage[];
  onSendMessage?: (message: string) => Promise<{
    response: string;
    booking_reference?: string;
    booking_id?: string;
    status?: string;
  }>;
  onReset?: () => void;
  onBookingConfirmed?: (details: {
    booking_id?: string;
    booking_reference?: string;
    status?: string;
  }) => void;
  onToggle?: (isOpen: boolean) => void;
}

export interface ScheduluxWidgetInstance {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: () => boolean;
  sendMessage: (text: string) => Promise<void>;
  resetConversation: () => void;
  updateConfig: (newConfig: Partial<WidgetConfig>) => void;
  destroy: () => void;
}
