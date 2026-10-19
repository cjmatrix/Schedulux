import { ServiceEntity } from '../entities/service.entity.js';

export interface FindServicesFilter {
  page: number;
  limit: number;
  category?: string;
  agentId?: string;
  search?: string;
}

export interface ServiceSummary {
  totalCount: number;
  avgPrice: number;
  depositCount: number;
  categories: string[];
}

export interface IServiceRepository {
  create(service: ServiceEntity): Promise<ServiceEntity>;
  findById(tenantId: string, serviceId: string): Promise<ServiceEntity | null>;
  findAll(tenantId: string, filter: FindServicesFilter): Promise<{
    services: ServiceEntity[];
    total: number;
    summary?: ServiceSummary;
  }>;
  update(service: ServiceEntity): Promise<ServiceEntity | null>;
  delete(tenantId: string, serviceId: string): Promise<boolean>;
  bulkUpsert(services: ServiceEntity[]): Promise<ServiceEntity[]>;
  findByTenant(tenantId: string, agentId?: string): Promise<ServiceEntity[]>;
}
