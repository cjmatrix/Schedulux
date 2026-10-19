import {
  ListTenantsRequest,
  ListTenantsResponse,
} from "@repo/proto/tenant";

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

  suspendTenant(tenantId: string): Promise<SuspendTenantResult>;
}
