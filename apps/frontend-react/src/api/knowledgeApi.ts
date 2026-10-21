import type { AgentDraftSchema } from '../pages/onboarding/types.js';
import { type ApiResponse, axiosClient } from './axiosClient.js';

export interface CrawlSiteRequest {
  tenant_id: string;
  url: string;
}

export interface CrawlSiteResponse {
  job_id: string;
  status: string;
}

export interface GetCrawlStatusResponse {
  job_id: string;
  status: string;
  pages_crawled: number;
  pages: Array<{
    url: string;
    markdown: string;
    success: boolean;
    error: string;
  }>;
}

export interface GetDraftSchemaResponse {
  status: 'pending' | 'completed';
  schema: AgentDraftSchema | null;
}

export interface SaveInitialAgentDraftRequest {
  draft_json?: string;
  name?: string;
  creation_source?: string;
}

export interface SaveInitialAgentDraftResponse {
  agent_id: string;
  status: string;
}

export interface AgentSummaryInfo {
  agent_id: string;
  name: string;
  status: 'pending' | 'created';
  creation_source: string;
  services_count: number;
  updated_at: string;
  created_at: string;
}

export const knowledgeApi = {
  crawlSite: async (payload: CrawlSiteRequest): Promise<ApiResponse<CrawlSiteResponse>> => {
    const response = await axiosClient.post<ApiResponse<CrawlSiteResponse>>(
      '/api/v1/tenant/knowledge/crawl',
      payload,
    );
    return response.data;
  },

  getCrawlStatus: async (
    tenantId: string,
    jobId: string,
  ): Promise<ApiResponse<GetCrawlStatusResponse>> => {
    const response = await axiosClient.get<ApiResponse<GetCrawlStatusResponse>>(
      `/api/v1/tenant/knowledge/crawl/status?tenant_id=${encodeURIComponent(tenantId)}&job_id=${encodeURIComponent(jobId)}`,
    );
    return response.data;
  },

  getDraftSchema: async (
    tenantId: string,
    jobId?: string,
  ): Promise<ApiResponse<GetDraftSchemaResponse>> => {
    let url = `/api/v1/tenant/knowledge/schema?tenant_id=${encodeURIComponent(tenantId)}`;
    if (jobId) {
      url += `&job_id=${encodeURIComponent(jobId)}`;
    }
    const response = await axiosClient.get<ApiResponse<GetDraftSchemaResponse>>(url);
    return response.data;
  },

  saveInitialAgentDraft: async (
    payload: SaveInitialAgentDraftRequest,
  ): Promise<ApiResponse<SaveInitialAgentDraftResponse>> => {
    const response = await axiosClient.post<ApiResponse<SaveInitialAgentDraftResponse>>(
      '/api/v1/tenant/knowledge/agents/draft',
      payload,
    );
    return response.data;
  },

  listTenantAgents: async (): Promise<ApiResponse<AgentSummaryInfo[]>> => {
    const response = await axiosClient.get<ApiResponse<AgentSummaryInfo[]>>(
      '/api/v1/tenant/knowledge/agents',
    );
    return response.data;
  },
};

export type * from './onboardingApi.js';
export { onboardingApi } from './onboardingApi.js';
