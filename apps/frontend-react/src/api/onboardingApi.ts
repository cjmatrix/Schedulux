import type { AgentDraftSchema } from '../pages/onboarding/types.js';
import { type ApiResponse, axiosClient } from './axiosClient.js';

export interface RawAgentMessage {
  id?: string;
  message_id?: string;
  role: 'tenant' | 'agent' | string;
  content?: string;
  text?: string;
  created_at?: string;
}

export interface GetAgentMessagesResponse {
  messages: RawAgentMessage[];
  next_cursor?: string | null;
  has_more?: boolean;
}

export interface StartOnboardingRequest {
  tenant_id: string;
  agent_id: string;
}

export interface OnboardingSessionResponse {
  status: 'complete' | 'awaiting_input' | 'error' | string;
  question?: string;
  field?: string;
  type?: string;
  draft_schema: AgentDraftSchema;
  live_schema?: AgentDraftSchema | null;
}

export interface SendOnboardingMessageRequest {
  tenant_id: string;
  agent_id: string;
  user_answer: string;
}

export interface SendSandboxMessageRequest {
  tenant_id?: string;
  agent_id?: string;
  session_id?: string;
  token?: string;
  message: string;
  customer_name?: string;
  customer_phone?: string;
}

export interface SendSandboxMessageResponse {
  reply: string;
  session_id?: string;
  token?: string;
  history?: Array<{
    id?: string;
    role: string;
    content: string;
    created_at?: string;
  }>;
  booking_reference?: string;
  booking_id?: string;
  status?: string;
}

export interface InitSandboxSessionRequest {
  tenant_id?: string;
  agent_id?: string;
  token?: string;
  session_id?: string;
}

export interface InitSandboxSessionResponse {
  is_first_time: boolean;
  session_id: string;
  token: string;
  messages: Array<{
    id?: string;
    role: string;
    content: string;
    created_at?: string;
  }>;
  next_cursor?: string | null;
  has_more?: boolean;
}

export const onboardingApi = {
  getAgentMessages: async (
    agentId: string,
    params?: { limit?: number; before?: string },
  ): Promise<ApiResponse<GetAgentMessagesResponse>> => {
    const response = await axiosClient.get<ApiResponse<GetAgentMessagesResponse>>(
      `/api/v1/tenant/knowledge/agents/${encodeURIComponent(agentId)}/messages`,
      { params: { limit: params?.limit ?? 50, before: params?.before } },
    );
    return response.data;
  },

  startSession: async (
    payload: StartOnboardingRequest,
  ): Promise<ApiResponse<OnboardingSessionResponse>> => {
    const response = await axiosClient.post<ApiResponse<OnboardingSessionResponse>>(
      '/api/v1/tenant/knowledge/onboarding/start',
      payload,
    );
    return response.data;
  },

  sendMessage: async (
    payload: SendOnboardingMessageRequest,
  ): Promise<ApiResponse<OnboardingSessionResponse>> => {
    const response = await axiosClient.post<ApiResponse<OnboardingSessionResponse>>(
      '/api/v1/tenant/knowledge/onboarding/message',
      payload,
    );
    return response.data;
  },

  sendMessageStream: async (
    payload: SendOnboardingMessageRequest,
    onDelta?: (delta: string) => void,
  ): Promise<ApiResponse<OnboardingSessionResponse>> => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const base = apiBase.replace(/\/+$/, '');
    const url = `${base}/api/v1/tenant/knowledge/onboarding/message/stream`;

    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
    } catch (fetchErr) {
      console.warn('[Onboarding Stream] Stream fetch failed, falling back to unary:', fetchErr);
      return onboardingApi.sendMessage(payload);
    }

    if (!res.ok || !res.body) {
      console.warn(
        `[Onboarding Stream] Stream endpoint status ${res.status}, falling back to unary.`,
      );
      return onboardingApi.sendMessage(payload);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullResponse = '';
    let finalDoneChunk: any = null;

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
            if (data.event_type === 'token' && data.delta) {
              fullResponse += data.delta;
              onDelta?.(data.delta);
            } else if (data.event_type === 'done') {
              finalDoneChunk = data;
              if (data.question && !fullResponse) {
                fullResponse = data.question;
                onDelta?.(data.question);
              }
            } else if (data.event_type === 'error') {
              if (data.error && !fullResponse) {
                fullResponse = data.error;
                onDelta?.(data.error);
              }
            }
          } catch {
            // chunk parse error ignored
          }
        }
      }
    } catch (streamErr) {
      console.warn('[Onboarding Stream] Stream interrupted:', streamErr);
    }

    const parsedDraft = finalDoneChunk?.draft_schema_json
      ? JSON.parse(finalDoneChunk.draft_schema_json)
      : ({} as AgentDraftSchema);

    const parsedLive = finalDoneChunk?.live_schema_json
      ? JSON.parse(finalDoneChunk.live_schema_json)
      : null;

    return {
      message: 'Onboarding message processed successfully',
      data: {
        status: finalDoneChunk?.status || 'awaiting_input',
        question: fullResponse || finalDoneChunk?.question || '',
        field: finalDoneChunk?.field || '',
        type: finalDoneChunk?.type || 'semantic_review',
        draft_schema: parsedDraft,
        live_schema: parsedLive,
      },
    };
  },

  sendSandboxMessage: async (
    payload: SendSandboxMessageRequest,
  ): Promise<ApiResponse<SendSandboxMessageResponse>> => {
    const response = await axiosClient.post<ApiResponse<SendSandboxMessageResponse>>(
      '/api/v1/tenant/knowledge/onboarding/sandbox',
      payload,
    );
    return response.data;
  },

  initSandboxSession: async (
    payload: InitSandboxSessionRequest,
  ): Promise<ApiResponse<InitSandboxSessionResponse>> => {
    const response = await axiosClient.post<ApiResponse<InitSandboxSessionResponse>>(
      '/api/v1/tenant/knowledge/onboarding/sandbox/init',
      payload,
    );
    return response.data;
  },

  getSandboxWidgetConfig: async (params: {
    tenant_id?: string;
    agent_id?: string;
  }): Promise<
    ApiResponse<{
      tenant_id: string;
      agent_id: string;
      widget_config: Record<string, unknown>;
    }>
  > => {
    const query = new URLSearchParams();
    if (params.tenant_id) query.append('tenant_id', params.tenant_id);
    if (params.agent_id) query.append('agent_id', params.agent_id);
    const response = await axiosClient.get(
      `/api/v1/tenant/knowledge/onboarding/sandbox/config?${query.toString()}`,
    );
    return response.data;
  },

  getSandboxMessages: async (params: {
    agent_id?: string;
    session_id?: string;
    token?: string;
    before?: string;
    limit?: number;
  }): Promise<
    ApiResponse<{
      messages: Array<{
        id?: string;
        role: string;
        content: string;
        created_at?: string;
      }>;
      next_cursor?: string | null;
      has_more?: boolean;
    }>
  > => {
    const response = await axiosClient.get('/api/v1/tenant/knowledge/onboarding/sandbox/messages', {
      params,
    });
    return response.data;
  },
};
