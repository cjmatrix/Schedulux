import { axiosClient, type ApiResponse } from '../../../api/axiosClient';

export interface TierConfigData {
  id: string;
  tier: string;
  name: string;
  max_agents: number;
  max_services: number;
  max_resources: number;
  max_kb_docs: number;
  max_kb_doc_size_mb: number;
  weekly_token_limit: number;
  rate_limit_rpm: number;
  status: 'active' | 'deprecated' | 'inactive';
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateTierConfigPayload {
  name?: string;
  max_agents?: number;
  max_services?: number;
  max_resources?: number;
  max_kb_docs?: number;
  max_kb_doc_size_mb?: number;
  weekly_token_limit?: number;
  rate_limit_rpm?: number;
  status?: 'active' | 'deprecated' | 'inactive';
  description?: string;
}

export const tierConfigApi = {
  getTierConfigs: async (): Promise<TierConfigData[]> => {
    const { data } = await axiosClient.get<ApiResponse<TierConfigData[]>>(
      '/api/v1/superadmin/tier-configs',
    );
    return data.data;
  },

  getTierConfigByTier: async (tier: string): Promise<TierConfigData> => {
    const { data } = await axiosClient.get<ApiResponse<TierConfigData>>(
      `/api/v1/superadmin/tier-configs/${tier}`,
    );
    return data.data;
  },

  updateTierConfig: async (
    tier: string,
    payload: UpdateTierConfigPayload,
  ): Promise<TierConfigData> => {
    const { data } = await axiosClient.put<ApiResponse<TierConfigData>>(
      `/api/v1/superadmin/tier-configs/${tier}`,
      payload,
    );
    return data.data;
  },
};

