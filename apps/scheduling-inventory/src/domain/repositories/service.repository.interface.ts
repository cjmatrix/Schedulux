import { ServiceEntity } from '../entities/service.entity.js';

export interface FindServicesFilter {
  page: number;
  limit: number;
  category?: string;
}

export interface IServiceRepository {
  create(service: ServiceEntity): Promise<ServiceEntity>;
  findById(tenantId: string, serviceId: string): Promise<ServiceEntity | null>;
  findAll(tenantId: string, filter: FindServicesFilter): Promise<{ services: ServiceEntity[]; total: number }>;
  update(service: ServiceEntity): Promise<ServiceEntity | null>;
  delete(tenantId: string, serviceId: string): Promise<boolean>;
}
