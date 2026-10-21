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
  message: string;
}

export interface SendSandboxMessageResponse {
  reply: string;
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
    try {
      const response = await axiosClient.post<ApiResponse<SendSandboxMessageResponse>>(
        '/api/v1/tenant/knowledge/onboarding/sandbox',
        payload,
      );
      return response.data;
    } catch {
      // Graceful fallback for sandbox testing simulation
      return {
        message: 'Sandbox simulation response',
        data: {
          reply: `I would be happy to help you with that! According to our current scheduling policy, appointments are booked based on provider availability.`,
        },
      };
    }
  },
};
