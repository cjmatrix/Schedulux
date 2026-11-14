import { IDashboardUser } from '../model/DashboardUser.js';

export interface FindWorkspaceUsersOptions {
  tenantId: string;
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  agentId?: string;
}

export interface IDashboardUserRepository {
  create(data: Partial<IDashboardUser>): Promise<IDashboardUser>;
  findByEmail(email: string): Promise<IDashboardUser | null>;
  findAllByEmail(email: string): Promise<IDashboardUser[]>;
  findByTenantAndEmail(tenantId: string, email: string): Promise<IDashboardUser | null>;
  findByTenantAgentAndEmail(
    tenantId: string,
    agentId: string,
    email: string,
  ): Promise<IDashboardUser | null>;
  findById(id: string): Promise<IDashboardUser | null>;
  findByTenantId(tenantId: string): Promise<IDashboardUser[]>;
  findWorkspaceUsers(
    options: FindWorkspaceUsersOptions,
  ): Promise<{ users: IDashboardUser[]; total_count: number }>;
  update(id: string, data: Partial<IDashboardUser>): Promise<IDashboardUser | null>;
  addAgentToUser(userId: string, agentId: string): Promise<IDashboardUser | null>;
  updateStatus(
    tenantId: string,
    userId: string,
    status: 'active' | 'suspended',
  ): Promise<IDashboardUser | null>;
}
