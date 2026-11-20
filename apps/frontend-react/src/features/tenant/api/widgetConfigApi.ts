import type { WidgetConfig } from '@repo/widget';
import { type ApiResponse, axiosClient } from '../../../api/axiosClient';

export interface WidgetConfigResponseData {
  tenant_id: string;
  agent_id: string;
  widget_config: Partial<WidgetConfig> & {
    whitelisted_domains?: string[];
  };
}

export interface UpdateWidgetConfigPayload {
  whitelisted_domains: string[];
  widget_config_json?: string;
}

export const widgetConfigApi = {
  getWidgetConfig: async (
    agentId: string,
    source: 'live' | 'draft' = 'live',
  ): Promise<ApiResponse<WidgetConfigResponseData>> => {
    const { data } = await axiosClient.get<ApiResponse<WidgetConfigResponseData>>(
      `/api/v1/tenant/knowledge/agents/${agentId}/widget/config`,
      {
        params: { source },
      },
    );
    return data;
  },

  updateWidgetConfig: async (
    agentId: string,
    payload: UpdateWidgetConfigPayload,
  ): Promise<ApiResponse<{ success: boolean; widget_config: Partial<WidgetConfig> }>> => {
    const { data } = await axiosClient.put<
      ApiResponse<{ success: boolean; widget_config: Partial<WidgetConfig> }>
    >(`/api/v1/tenant/knowledge/agents/${agentId}/widget/config`, payload);
    return data;
  },
};
