import { ISuperAdmin } from '../model/SuperAdmin.js';

export interface ISuperAdminRepository {
  create(admin: Partial<ISuperAdmin>): Promise<ISuperAdmin>;
  findById(id: string): Promise<ISuperAdmin | null>;
  findByEmail(email: string): Promise<ISuperAdmin | null>;
}
