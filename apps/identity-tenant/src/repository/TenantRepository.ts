import mongoose from "mongoose";
import { Injectable } from "@nestjs/common";
import { BaseRepository } from "./BaseRepository.js";
import {
  ITenantRepository,
  ListTenantsRequest,
  ListTenantsResponse,
} from "../interfaces/ITenantRepository.js";
import { ITenant, Tenent } from "../model/Tenent.js";

@Injectable()
export class TenantRepository
  extends BaseRepository<ITenant>
  implements ITenantRepository
{
  constructor() {
    super(Tenent);
  }

  async findByTenantId(tenantId: string): Promise<ITenant | null> {
    return this.model.findById(tenantId) 
  }

  async findByEmail(email: string): Promise<ITenant | null> {
    return this.findOne({ contact_email: email });
  }

  async updateStatus(
    tenantId: string,
    status: string,
  ): Promise<ITenant | null> {
    const tenant = await this.findByTenantId(tenantId);
    if (!tenant) return null;
    tenant.status = status;
    return tenant.save();
  }

  async listTenants(data: ListTenantsRequest): Promise<ListTenantsResponse> {
    const page = Math.max(1, data.page);
    const limit = Math.max(1, Math.min(data.limit, 100));
    const skip = (page - 1) * limit;

    const query: any = {};
    if (data.status && data.status.toLowerCase() !== 'all') {
      query.status = data.status.toLowerCase();
    }
    if (data.tier && data.tier.toLowerCase() !== 'all tiers') {
      query.tier = data.tier.toLowerCase();
    }
    if (data.search) {
      query.$or = [
        { business_name: { $regex: data.search, $options: 'i' } },
        { contact_email: { $regex: data.search, $options: 'i' } },
        { tenant_id: { $regex: data.search, $options: 'i' } },
      ];
    }

    const [docs, totalCount] = await Promise.all([
      this.model
        .find(query)
        .skip(skip)
        .limit(limit)
        .select("-password_hash")
        .exec(),
      this.model.countDocuments(query).exec(),
    ]);

    const tenants = docs.map((t: any) => ({
      tenant_id: (t.tenant_id || t._id).toString(),
      business_name: t.business_name,
      contact_email: t.contact_email,
      tier: t.tier,
      status: t.status,
    }));

    return { tenants, total_count: totalCount };
  }
}
