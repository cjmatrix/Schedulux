import { axiosClient, type ApiResponse } from './axiosClient.js';

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
  schema: any | null;
}

export const knowledgeApi = {
  crawlSite: async (payload: CrawlSiteRequest): Promise<ApiResponse<CrawlSiteResponse>> => {
    const response = await axiosClient.post<ApiResponse<CrawlSiteResponse>>(
      '/api/v1/tenant/knowledge/crawl',
      payload
    );
    return response.data;
  },

  getCrawlStatus: async (tenantId: string, jobId: string): Promise<ApiResponse<GetCrawlStatusResponse>> => {
    const response = await axiosClient.get<ApiResponse<GetCrawlStatusResponse>>(
      `/api/v1/tenant/knowledge/crawl/status?tenant_id=${encodeURIComponent(tenantId)}&job_id=${encodeURIComponent(jobId)}`
    );
    return response.data;
  },

  getDraftSchema: async (tenantId: string, jobId?: string): Promise<ApiResponse<GetDraftSchemaResponse>> => {
    let url = `/api/v1/tenant/knowledge/schema?tenant_id=${encodeURIComponent(tenantId)}`;
    if (jobId) {
      url += `&job_id=${encodeURIComponent(jobId)}`;
    }
    const response = await axiosClient.get<ApiResponse<GetDraftSchemaResponse>>(url);
    return response.data;
  },
};
