import {
  GetTenantByIdResponse,
  ListTenantsRequest,
  ListTenantsResponse,
} from '@repo/proto/tenant';
import type { TierConfigItem } from '@repo/proto/superadmin';

export interface SuperAdminAuthResult {
  superAdmin: {
    id: string;
    email: string;
    name: string;
    role: string;
    created_at: Date | string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface SuperAdminProfileResult {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: Date | string;
}

export interface SuspendTenantResult {
  message: string;
  tenant: {
    tenant_id: string;
    business_name: string;
    contact_email: string;
    tier: string;
    status: string;
  };
}

export interface SuperAdminOverviewResult {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  totalRevenue: number;
  currency: string;
  tenantsByTier: Record<string, number>;
}

export interface RevenueDataPointResult {
  date: string;
  amount: number;
  transactionCount: number;
}

export interface ISuperAdminService {
  login(email: string, password: string): Promise<SuperAdminAuthResult>;

  refreshToken(incomingRefreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }>;

  logout(incomingRefreshToken?: string): Promise<void>;

  createSuperAdmin(data: {
    email: string;
    password: string;
    name: string;
  }): Promise<SuperAdminProfileResult>;

  getProfile(adminId: string): Promise<SuperAdminProfileResult>;

  ListTenants(data: ListTenantsRequest): Promise<ListTenantsResponse>;

  getTenantById(tenantId: string): Promise<GetTenantByIdResponse>;

  suspendTenant(tenantId: string): Promise<SuspendTenantResult>;

  getOverview(startDate?: string, endDate?: string): Promise<SuperAdminOverviewResult>;

  getRevenueChart(
    startDate?: string,
    endDate?: string,
    interval?: string,
  ): Promise<RevenueDataPointResult[]>;

  listTierConfigs(): Promise<TierConfigItem[]>;

  getTierConfig(tier: string): Promise<TierConfigItem>;

  updateTierConfig(tier: string, data: Partial<TierConfigItem>): Promise<TierConfigItem>;
}
