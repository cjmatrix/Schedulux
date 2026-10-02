import { Injectable } from "@nestjs/common";
import { IDashboardUserRepository } from "../interfaces/IDashboardUserRepository.js";
import { DashboardUser, IDashboardUser } from "../model/DashboardUser.js";
import { BaseRepository } from "./BaseRepository.js";

@Injectable()
export class DashboardUserRepository
  extends BaseRepository<IDashboardUser>
  implements IDashboardUserRepository
{
  constructor() {
    super(DashboardUser);
  }

  async findByEmail(email: string): Promise<IDashboardUser | null> {
    return this.model.findOne({ email }).exec();
  }

  async findByTenantId(tenantId: string): Promise<IDashboardUser[]> {
    return this.model.find({ tenant_id: tenantId }).select("-password_hash").exec();
  }

  async findWorkspaceUsers(options: {
    tenantId: string;
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }): Promise<{ users: IDashboardUser[]; total_count: number }> {
    const { tenantId, page = 1, limit = 10, search, role } = options;
    const query: any = { tenant_id: tenantId };

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { email: regex }];
    }

    if (role && role !== 'all') {
      const mappedRole = role === 'owner' ? 'root' : role;
      query.system_role = mappedRole;
    }

    const skip = (page - 1) * limit;

    const [users, total_count] = await Promise.all([
      this.model.find(query).select('-password_hash').skip(skip).limit(limit).exec(),
      this.model.countDocuments(query).exec(),
    ]);

    return { users, total_count };
  }
}