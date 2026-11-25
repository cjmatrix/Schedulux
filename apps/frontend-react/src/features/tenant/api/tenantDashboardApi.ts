import { axiosClient, type ApiResponse } from '../../../api/axiosClient';

export interface TenantActiveAgentInfo {
  agent_id: string;
  name: string;
  status: string;
  creation_source: string;
  created_at?: string;
  updated_at?: string;
}

export interface TenantAgentOption {
  agent_id: string;
  name: string;
  status: string;
}

export interface TenantRecentBooking {
  booking_id: string;
  booking_reference: string;
  customer_name: string;
  customer_phone: string;
  start_time: string;
  end_time?: string;
  status: string;
  source?: string;
}

export interface TenantRecentService {
  service_id: string;
  name: string;
  category: string;
  duration_minutes: number;
  price?: {
    amount: number;
    currency: string;
  };
}

export interface TenantDashboardOverviewData {
  agent: TenantActiveAgentInfo | null;
  agents_list: TenantAgentOption[];
  inventory: {
    total_services: number;
    total_resources: number;
    recent_services: TenantRecentService[];
  };
  bookings: {
    total: number;
    confirmed: number;
    pending: number;
    recent: TenantRecentBooking[];
  };
  knowledge: {
    total_documents: number;
  };
  tokens: {
    used_this_week: number;
    weekly_limit: number;
  };
  tier: {
    name: string;
    tier: string;
    max_services: number;
    weekly_token_limit: number;
  };
}

export const tenantDashboardApi = {
  getOverview: async (agentId?: string): Promise<TenantDashboardOverviewData> => {
    const params = agentId ? { agent_id: agentId } : undefined;
    const { data } = await axiosClient.get<ApiResponse<TenantDashboardOverviewData>>(
      '/api/v1/tenant/dashboard/overview',
      { params },
    );
    return data.data;
  },
};
