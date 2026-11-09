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

  getDocumentUploadUrl: async (payload: {
    agent_id: string;
    file_name: string;
    file_size_bytes?: number;
  }): Promise<
    ApiResponse<{
      upload_url: string;
      document_id: string;
      s3_key: string;
      expires_in: number;
    }>
  > => {
    const response = await axiosClient.post<
      ApiResponse<{
        upload_url: string;
        document_id: string;
        s3_key: string;
        expires_in: number;
      }>
    >('/api/v1/tenant/knowledge/documents/upload-url', payload);
    return response.data;
  },

  confirmDocumentUpload: async (payload: {
    document_id: string;
  }): Promise<ApiResponse<{ success: boolean }>> => {
    const response = await axiosClient.post<ApiResponse<{ success: boolean }>>(
      '/api/v1/tenant/knowledge/documents/confirm',
      payload,
    );
    return response.data;
  },

  listDocuments: async (agentId?: string): Promise<ApiResponse<KnowledgeDocumentInfo[]>> => {
    const url = agentId
      ? `/api/v1/tenant/knowledge/documents?agent_id=${encodeURIComponent(agentId)}`
      : '/api/v1/tenant/knowledge/documents';
    const response = await axiosClient.get<ApiResponse<KnowledgeDocumentInfo[]>>(url);
    return response.data;
  },

  deleteDocument: async (documentId: string): Promise<ApiResponse<{ success: boolean }>> => {
    const response = await axiosClient.delete<ApiResponse<{ success: boolean }>>(
      `/api/v1/tenant/knowledge/documents/${encodeURIComponent(documentId)}`,
    );
    return response.data;
  },

  uploadFileToS3: async (
    uploadUrl: string,
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl, true);
      xhr.setRequestHeader('Content-Type', file.type || 'application/pdf');

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`S3 upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error during S3 upload'));
      };

      xhr.send(file);
    });
  },
};

export interface KnowledgeDocumentInfo {
  id: string;
  tenant_id: string;
  agent_id: string;
  file_name: string;
  file_size_bytes: number;
  s3_key: string;
  s3_bucket: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export type * from './onboardingApi.js';
export { onboardingApi } from './onboardingApi.js';
