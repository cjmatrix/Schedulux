import { axiosClient, type ApiResponse } from '../../../api/axiosClient';

export interface SuperAdminOverviewData {
  tenants: {
    total: number;
    active: number;
    suspended: number;
    by_tier: Record<string, number>;
  };
  agents: {
    total: number;
    active: number;
    draft: number;
  };
  revenue: {
    total: number;
    currency: string;
  };
  tokens: {
    total: number;
  };
}

export interface RevenueDataPoint {
  date: string;
  amount: number;
  transaction_count: number;
}

export interface TokenDataPoint {
  date: string;
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
}

export interface TopTenantTokenUsage {
  tenant_id: string;
  business_name: string;
  email: string;
  tier: string;
  total_tokens: number;
}

export interface DashboardDateFilter {
  startDate?: string;
  endDate?: string;
}

export const superAdminDashboardApi = {
  getOverview: async (filter?: DashboardDateFilter): Promise<SuperAdminOverviewData> => {
    const { data } = await axiosClient.get<ApiResponse<SuperAdminOverviewData>>(
      '/api/v1/superadmin/dashboard/overview',
      { params: filter },
    );
    return data.data;
  },

  getRevenueChart: async (
    filter?: DashboardDateFilter & { interval?: 'day' | 'week' | 'month' },
  ): Promise<RevenueDataPoint[]> => {
    const { data } = await axiosClient.get<ApiResponse<RevenueDataPoint[]>>(
      '/api/v1/superadmin/dashboard/revenue-chart',
      { params: filter },
    );
    return data.data;
  },

  getTokenChart: async (
    filter?: DashboardDateFilter & { interval?: 'day' | 'month' },
  ): Promise<TokenDataPoint[]> => {
    const { data } = await axiosClient.get<ApiResponse<TokenDataPoint[]>>(
      '/api/v1/superadmin/dashboard/token-chart',
      { params: filter },
    );
    return data.data;
  },

  getTopTenants: async (
    filter?: DashboardDateFilter & { limit?: number },
  ): Promise<TopTenantTokenUsage[]> => {
    const { data } = await axiosClient.get<ApiResponse<TopTenantTokenUsage[]>>(
      '/api/v1/superadmin/dashboard/top-tenants',
      { params: filter },
    );
    return data.data;
  },
};
