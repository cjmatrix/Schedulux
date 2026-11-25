import { Injectable } from '@nestjs/common';
import {
  FindWorkspaceUsersOptions,
  IDashboardUserRepository,
} from '../interfaces/IDashboardUserRepository.js';
import { DashboardUser, IDashboardUser } from '../model/DashboardUser.js';
import { BaseRepository } from './BaseRepository.js';

@Injectable()
export class DashboardUserRepository
  extends BaseRepository<IDashboardUser>
  implements IDashboardUserRepository
{
  constructor() {
    super(DashboardUser);
  }

  async findByEmail(email: string): Promise<IDashboardUser | null> {
    return this.model.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  async findAllByEmail(email: string): Promise<IDashboardUser[]> {
    return this.model.find({ email: email.toLowerCase().trim() }).exec();
  }

  async findByTenantAndEmail(tenantId: string, email: string): Promise<IDashboardUser | null> {
    return this.model
      .findOne({
        tenant_id: tenantId,
        email: email.toLowerCase().trim(),
      })
      .exec();
  }

  async findByTenantAgentAndEmail(
    tenantId: string,
    agentId: string,
    email: string,
  ): Promise<IDashboardUser | null> {
    return this.model
      .findOne({
        tenant_id: tenantId,
        agent_ids: agentId,
        email: email.toLowerCase().trim(),
      })
      .exec();
  }

  async addAgentToUser(userId: string, agentId: string): Promise<IDashboardUser | null> {
    return this.model
      .findByIdAndUpdate(
        userId,
        {
          $addToSet: { agent_ids: agentId },
        },
        { new: true },
      )
      .exec();
  }

  async findByTenantId(tenantId: string): Promise<IDashboardUser[]> {
    return this.model.find({ tenant_id: tenantId }).select('-password_hash').exec();
  }

  async findWorkspaceUsers(
    options: FindWorkspaceUsersOptions,
  ): Promise<{ users: IDashboardUser[]; total_count: number }> {
    const { tenantId, page = 1, limit = 10, search, role, agentId } = options;
    const query: Record<string, unknown> = { tenant_id: tenantId };

    if (agentId?.trim()) {
      const cleanAgentId = agentId.trim();
      query.agent_ids = cleanAgentId;
    }

    if (search?.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { email: regex }];
    }

    if (role && role !== 'all') {
      query.system_role = role;
    }

    const skip = (page - 1) * limit;

    const [users, total_count] = await Promise.all([
      this.model.find(query).select('-password_hash').skip(skip).limit(limit).exec(),
      this.model.countDocuments(query).exec(),
    ]);

    return { users, total_count };
  }

  async update(id: string, data: Partial<IDashboardUser>): Promise<IDashboardUser | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async updateStatus(
    tenantId: string,
    userId: string,
    status: 'active' | 'suspended',
  ): Promise<IDashboardUser | null> {
    return this.model
      .findOneAndUpdate(
        { _id: userId, tenant_id: tenantId },
        { $set: { status } },
        { new: true },
      )
      .exec();
  }
}
