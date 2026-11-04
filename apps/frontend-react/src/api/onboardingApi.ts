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
    const response = await axiosClient.get(
      '/api/v1/tenant/knowledge/onboarding/sandbox/messages',
      { params },
    );
    return response.data;
  },
};
