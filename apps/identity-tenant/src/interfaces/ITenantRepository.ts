import { ListTenantsRequest, ListTenantsResponse } from '@repo/proto/tenant';
import { UpdateQuery } from 'mongoose';
import { ITenant, TenantTier } from '../model/Tenent.js';

interface InputData {
  _id?: string;
  business_name: string;
  contact_email: string;
  password_hash?: string;
  auth_provider?: 'local' | 'google';
  google_id?: string;
  tier: TenantTier;
  status: string;
}

export interface ITenantRepository {
  create(data: InputData): Promise<ITenant>;
  findById(id: string): Promise<ITenant | null>;
  findByTenantId(tenantId: string): Promise<ITenant | null>;
  findByEmail(email: string): Promise<ITenant | null>;
  update(id: string, data: UpdateQuery<ITenant>): Promise<ITenant | null>;
  updateStatus(tenantId: string, status: string): Promise<ITenant | null>;
  listTenants(data: ListTenantsRequest): Promise<ListTenantsResponse>;
  findByPaddleSubscriptionId(subscriptionId: string): Promise<ITenant | null>;
  findByPaddleCustomerId(customerId: string): Promise<ITenant | null>;
}

export type { ListTenantsRequest, ListTenantsResponse };
