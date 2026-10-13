import { ResourceEntity } from '../entities/resource.entity.js';

export interface FindResourcesFilter {
  page: number;
  limit: number;
  resourceType?: string;
  dispatchStatus?: string;
}

export interface IResourceRepository {
  create(resource: ResourceEntity): Promise<ResourceEntity>;
  findById(tenantId: string, resourceId: string): Promise<ResourceEntity | null>;
  findAll(tenantId: string, filter: FindResourcesFilter): Promise<{ resources: ResourceEntity[]; total: number }>;
  update(resource: ResourceEntity): Promise<ResourceEntity | null>;
  delete(tenantId: string, resourceId: string): Promise<boolean>;
}
