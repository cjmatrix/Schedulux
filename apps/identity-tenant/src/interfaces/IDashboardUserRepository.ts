import { IDashboardUser } from "../model/DashboardUser.js";


export interface FindWorkspaceUsersOptions {
  tenantId: string;
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}

export interface IDashboardUserRepository {
  create(data: Partial<IDashboardUser>): Promise<IDashboardUser>;
  findByEmail(email: string): Promise<IDashboardUser | null>;
  findByTenantId(tenantId: string): Promise<IDashboardUser[]>;
  findWorkspaceUsers(options: FindWorkspaceUsersOptions): Promise<{ users: IDashboardUser[]; total_count: number }>;
}