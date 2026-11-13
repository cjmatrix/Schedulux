import { Inject, Injectable, Optional } from '@nestjs/common';
import type { TenantInfo } from '@repo/proto/tenant';
import {
  ITenantRepository,
  ListTenantsRequest,
  ListTenantsResponse,
} from '../interfaces/ITenantRepository.js';
import type { IUnitOfWork } from '../interfaces/IUnitOfWork.js';
import { ITenant, Tenent } from '../model/Tenent.js';
import { BaseRepository } from './BaseRepository.js';

@Injectable()
export class TenantRepository extends BaseRepository<ITenant> implements ITenantRepository {
  constructor(
    @Optional()
    @Inject('IUnitOfWork')
    unitOfWork?: IUnitOfWork,
  ) {
    super(Tenent, unitOfWork);
  }

  async findByTenantId(tenantId: string): Promise<ITenant | null> {
    return this.model.findById(tenantId);
  }

  async findByEmail(email: string): Promise<ITenant | null> {
    return this.findOne({ contact_email: email });
  }

  async findByPaddleSubscriptionId(subscriptionId: string): Promise<ITenant | null> {
    return this.findOne({ paddle_subscription_id: subscriptionId });
  }

  async findByPaddleCustomerId(customerId: string): Promise<ITenant | null> {
    return this.findOne({ paddle_customer_id: customerId });
  }

  async updateStatus(tenantId: string, status: string): Promise<ITenant | null> {
    const tenant = await this.findByTenantId(tenantId);
    if (!tenant) return null;
    tenant.status = status;
    return tenant.save();
  }

  async ListUserByDate(date: string) {
    const tenants = await this.find({
      createdAt: { $eq: `${date}` },
    });

    return tenants;
  }

  async listTenants(data: ListTenantsRequest): Promise<ListTenantsResponse> {
    const page = Math.max(1, data.page || 1);
    const defaultLimit = data.tenant_ids && data.tenant_ids.length > 0 ? data.tenant_ids.length : 10;
    const limit = Math.max(1, Math.min(data.limit || defaultLimit, 100));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (data.tenant_ids && data.tenant_ids.length > 0) {
      query._id = { $in: data.tenant_ids };
    }
    if (data.status && data.status.toLowerCase() !== 'all') {
      query.status = data.status.toLowerCase();
    }
    if (data.tier && data.tier.toLowerCase() !== 'all tiers') {
      query.tier = data.tier.toLowerCase();
    }
    if (data.search) {
      const searchRegex = new RegExp(data.search, 'i');
      query.$or = [
        { business_name: searchRegex },
        { contact_email: searchRegex },
        { _id: searchRegex },
      ];
    }

    const [docs, totalCount] = await Promise.all([
      this.model.find(query).skip(skip).limit(limit).select('-password_hash').lean().exec(),
      this.model.countDocuments(query).exec(),
    ]);

    const tenants: TenantInfo[] = docs.map((t: any) => ({
      tenant_id: t._id.toString(),
      business_name: t.business_name,
      contact_email: t.contact_email,
      tier: t.tier,
      status: t.status,
    }));

    return { tenants, total_count: totalCount };
  }
}
