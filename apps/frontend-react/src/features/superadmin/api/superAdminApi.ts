import { axiosClient } from '../../../api/axiosClient';

export interface TenantItem {
  tenant_id: string;
  business_name: string;
  contact_email: string;
  tier: string;
  status: string;
}

export interface ListTenantsResponseData {
  message: string;
  data: {
    tenants: TenantItem[];
    total_count: number;
  };
}

export const superAdminApi = {
  getTenants: async (
    page = 1,
    limit = 10,
    search?: string,
    tier?: string,
    status?: string,
  ): Promise<ListTenantsResponseData> => {
    const { data } = await axiosClient.get<ListTenantsResponseData>('/api/v1/admin/tenants', {
      params: { page, limit, search, tier, status },
    });
    return data;
  },

  suspendTenant: async (
    tenantId: string,
  ): Promise<{ message: string; data: Record<string, unknown> }> => {
    const { data } = await axiosClient.patch<{ message: string; data: Record<string, unknown> }>(
      `/api/v1/admin/tenants/${tenantId}/suspend`,
    );
    return data;
  },
};
