import type { WidgetChatMessage, WidgetConfig } from './types';

interface SessionRecord {
  sessionId: string;
  token?: string;
  timestamp?: number;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function getStorageKey(tenantId: string, agentId: string): string {
  return `schedulux_sess_${tenantId}_${agentId}`;
}

export function loadStoredSession(tenantId: string, agentId: string): SessionRecord | null {
  try {
    const raw = localStorage.getItem(getStorageKey(tenantId, agentId));
    if (!raw) return null;
    const session = JSON.parse(raw) as SessionRecord;
    if (session.timestamp && Date.now() - session.timestamp > SEVEN_DAYS_MS) {
      clearStoredSession(tenantId, agentId);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function saveStoredSession(tenantId: string, agentId: string, session: SessionRecord): void {
  try {
    const record: SessionRecord = {
      ...session,
      timestamp: session.timestamp || Date.now(),
    };
    localStorage.setItem(getStorageKey(tenantId, agentId), JSON.stringify(record));
  } catch {}
}

export function clearStoredSession(tenantId: string, agentId: string): void {
  try {
    localStorage.removeItem(getStorageKey(tenantId, agentId));
  } catch {}
}

export async function fetchInitChat(
  apiBase: string,
  tenantId: string,
  agentId: string,
  mode: 'live' | 'sandbox' = 'live',
): Promise<{
  sessionId: string;
  token?: string;
  isFirstTime: boolean;
  messages: WidgetChatMessage[];
}> {
  const stored = loadStoredSession(tenantId, agentId);
  const base = apiBase.replace(/\/+$/, '');
  const url =
    mode === 'sandbox'
      ? `${base}/api/v1/tenant/knowledge/onboarding/sandbox/init`
      : `${base}/api/v1/public/chat/init`;

  const payload: Record<string, string | undefined> = {
    tenant_id: tenantId,
    agent_id: agentId,
  };
  if (stored?.sessionId) {
    payload.session_id = stored.sessionId;
  }
  if (stored?.token) {
    payload.token = stored.token;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: mode === 'sandbox' ? 'include' : 'same-origin',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Init failed with status: ${res.status}`);
  }

  const json = await res.json();
  const data = json.data || {};
  const newSession: SessionRecord = {
    sessionId: data.session_id,
    token: data.token,
  };

  saveStoredSession(tenantId, agentId, newSession);

  const rawMessages: Array<{ role: string; content?: string; text?: string; created_at?: string }> =
    data.messages || [];

  const formattedMessages: WidgetChatMessage[] = rawMessages.map((m, idx) => ({
    id: `init_${idx}`,
    role: m.role === 'user' ? 'user' : 'agent',
    content: m.content || m.text || '',
    created_at: m.created_at || new Date().toISOString(),
  }));

  return {
    sessionId: data.session_id,
    token: data.token,
    isFirstTime: Boolean(data.is_first_time),
    messages: formattedMessages,
  };
}

export async function postChatMessage(
  apiBase: string,
  tenantId: string,
  agentId: string,
  sessionId: string,
  token: string | undefined,
  message: string,
  customerName?: string,
  customerPhone?: string,
  mode: 'live' | 'sandbox' = 'live',
): Promise<{
  response: string;
  sessionId: string;
  token?: string;
  user_message_id?: string;
  agent_message_id?: string;
  created_at?: string;
  booking_id?: string;
  booking_reference?: string;
  status?: string;
}> {
  const base = apiBase.replace(/\/+$/, '');
  const url =
    mode === 'sandbox'
      ? `${base}/api/v1/tenant/knowledge/onboarding/sandbox`
      : `${base}/api/v1/public/chat`;

  const payload: Record<string, unknown> = {
    tenant_id: tenantId,
    agent_id: agentId,
    session_id: sessionId,
    token,
    message,
  };
  if (customerName) payload.customer_name = customerName;
  if (customerPhone) payload.customer_phone = customerPhone;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: mode === 'sandbox' ? 'include' : 'same-origin',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Message failed (${res.status}): ${errText || res.statusText}`);
  }

  const json = await res.json();
  const data = json.data || {};

  if (data.token) {
    saveStoredSession(tenantId, agentId, {
      sessionId: data.session_id || sessionId,
      token: data.token,
    });
  }

  return {
    response: data.response || data.reply || '',
    sessionId: data.session_id || sessionId,
    token: data.token || token,
    user_message_id: data.user_message_id || undefined,
    agent_message_id: data.agent_message_id || undefined,
    created_at: data.created_at || undefined,
    booking_id: data.booking_id || undefined,
    booking_reference: data.booking_reference || undefined,
    status: data.status || undefined,
  };
}

export async function postChatMessageStream(
  apiBase: string,
  tenantId: string,
  agentId: string,
  sessionId: string,
  token: string | undefined,
  message: string,
  customerName?: string,
  customerPhone?: string,
  mode: 'live' | 'sandbox' = 'live',
  onDelta?: (delta: string) => void,
): Promise<{
  response: string;
  sessionId: string;
  token?: string;
  user_message_id?: string;
  agent_message_id?: string;
  created_at?: string;
  booking_id?: string;
  booking_reference?: string;
  status?: string;
}> {
  const base = apiBase.replace(/\/+$/, '');
  const url =
    mode === 'sandbox'
      ? `${base}/api/v1/tenant/knowledge/onboarding/sandbox/stream`
      : `${base}/api/v1/public/chat/stream`;

  const payload: Record<string, unknown> = {
    tenant_id: tenantId,
    agent_id: agentId,
    session_id: sessionId,
    token,
    message,
  };
  if (customerName) payload.customer_name = customerName;
  if (customerPhone) payload.customer_phone = customerPhone;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      credentials: mode === 'sandbox' ? 'include' : 'same-origin',
      body: JSON.stringify(payload),
    });
  } catch (fetchErr) {
    console.warn('[Schedulux Widget] Stream fetch failed, falling back to unary:', fetchErr);
    return postChatMessage(
      apiBase,
      tenantId,
      agentId,
      sessionId,
      token,
      message,
      customerName,
      customerPhone,
      mode,
    );
  }

  if (!res.ok || !res.body) {
    console.warn(
      `[Schedulux Widget] Stream endpoint returned status ${res.status}, falling back to unary.`,
    );
    return postChatMessage(
      apiBase,
      tenantId,
      agentId,
      sessionId,
      token,
      message,
      customerName,
      customerPhone,
      mode,
    );
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullResponse = '';
  let finalMeta: Record<string, any> = {};

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const jsonStr = trimmed.slice(5).trim();
        if (!jsonStr) continue;

        try {
          const data = JSON.parse(jsonStr);
          if (data.token) {
            saveStoredSession(tenantId, agentId, {
              sessionId: data.session_id || sessionId,
              token: data.token,
            });
          }

          if (data.event_type === 'token' && data.delta) {
            fullResponse += data.delta;
            onDelta?.(data.delta);
          } else if (data.event_type === 'done') {
            finalMeta = data;
            if (data.response && !fullResponse) {
              fullResponse = data.response;
              onDelta?.(data.response);
            }
          } else if (data.event_type === 'error') {
            if (data.delta && !fullResponse) {
              fullResponse = data.delta;
              onDelta?.(data.delta);
            }
          }
        } catch {
          // ignore chunk parse error
        }
      }
    }
  } catch (streamErr) {
    console.warn('[Schedulux Widget] Stream read interrupted:', streamErr);
  }

  return {
    response: fullResponse || finalMeta.response || '',
    sessionId: finalMeta.session_id || sessionId,
    token: finalMeta.token || token,
    user_message_id: finalMeta.user_message_id || undefined,
    agent_message_id: finalMeta.agent_message_id || undefined,
    created_at: finalMeta.created_at || undefined,
    booking_id: finalMeta.booking_id || undefined,
    booking_reference: finalMeta.booking_reference || undefined,
    status: finalMeta.status || undefined,
  };
}

export async function fetchWidgetConfig(
  apiBase: string,
  tenantId: string,
  agentId: string,
  mode: 'live' | 'sandbox' = 'live',
): Promise<Partial<WidgetConfig>> {
  const base = apiBase.replace(/\/+$/, '');
  const url =
    mode === 'sandbox'
      ? `${base}/api/v1/tenant/knowledge/onboarding/sandbox/config?tenant_id=${encodeURIComponent(tenantId)}&agent_id=${encodeURIComponent(agentId)}`
      : `${base}/api/v1/public/chat/config?tenant_id=${encodeURIComponent(tenantId)}&agent_id=${encodeURIComponent(agentId)}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: mode === 'sandbox' ? 'include' : 'same-origin',
  });

  if (!res.ok) {
    throw new Error(`Widget config fetch failed (${res.status}): ${res.statusText}`);
  }

  const json = await res.json();
  return (json.data?.widget_config || {}) as Partial<WidgetConfig>;
}

export interface FetchChatMessagesParams {
  apiBase: string;
  tenantId: string;
  agentId: string;
  sessionId?: string;
  token?: string;
  before?: string;
  limit?: number;
  mode?: 'live' | 'sandbox';
}

export interface FetchChatMessagesResult {
  messages: WidgetChatMessage[];
  next_cursor: string | null;
  has_more: boolean;
}

export async function fetchChatMessages({
  apiBase,
  tenantId,
  agentId,
  sessionId,
  token,
  before,
  limit = 20,
  mode = 'live',
}: FetchChatMessagesParams): Promise<FetchChatMessagesResult> {
  const base = apiBase.replace(/\/+$/, '');
  const query = new URLSearchParams();
  query.append('tenant_id', tenantId);
  query.append('agent_id', agentId);
  if (sessionId) query.append('session_id', sessionId);
  if (token) query.append('token', token);
  if (before) query.append('before', before);
  query.append('limit', String(limit));

  const url =
    mode === 'sandbox'
      ? `${base}/api/v1/tenant/knowledge/onboarding/sandbox/messages?${query.toString()}`
      : `${base}/api/v1/public/chat/messages?${query.toString()}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: mode === 'sandbox' ? 'include' : 'same-origin',
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Fetch messages failed (${res.status}): ${errText || res.statusText}`);
  }

  const json = await res.json();
  const data = json.data || {};
  const rawMessages: Array<{
    id?: string;
    message_id?: string;
    role: string;
    content?: string;
    text?: string;
    created_at?: string;
    booking_id?: string;
    booking_reference?: string;
    status?: string;
  }> = data.messages || [];

  const formattedMessages: WidgetChatMessage[] = rawMessages.map((m, idx) => ({
    id: m.id || m.message_id || `msg_${Date.now()}_${idx}`,
    role: m.role === 'user' ? 'user' : 'agent',
    content: m.content || m.text || '',
    created_at: m.created_at || new Date().toISOString(),
    booking_id: m.booking_id,
    booking_reference: m.booking_reference,
    status: m.status,
  }));

  return {
    messages: formattedMessages,
    next_cursor: data.next_cursor || null,
    has_more: Boolean(data.has_more),
  };
}
