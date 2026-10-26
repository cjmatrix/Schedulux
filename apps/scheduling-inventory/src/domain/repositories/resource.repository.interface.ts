import { ResourceEntity } from '../entities/resource.entity.js';

export interface FindResourcesFilter {
  page: number;
  limit: number;
  resourceType?: string;
  dispatchStatus?: string;
  agentId?: string;
  category?: string;
  search?: string;
}

export interface ResourceSummary {
  totalCount: number;
  activeCount: number;
  staffCount: number;
  physicalCount: number;
}

export interface IResourceRepository {
  create(resource: ResourceEntity): Promise<ResourceEntity>;
  findById(tenantId: string, resourceId: string): Promise<ResourceEntity | null>;
  findAll(
    tenantId: string,
    filter: FindResourcesFilter,
  ): Promise<{
    resources: ResourceEntity[];
    total: number;
    summary?: ResourceSummary;
  }>;
  update(resource: ResourceEntity): Promise<ResourceEntity | null>;
  delete(tenantId: string, resourceId: string): Promise<boolean>;
  bulkUpsert(resources: ResourceEntity[]): Promise<ResourceEntity[]>;
  findByTenant(tenantId: string, agentId?: string): Promise<ResourceEntity[]>;
  findActiveBookableByIds(
    tenantId: string,
    resourceIds: string[],
    agentId?: string,
  ): Promise<ResourceEntity[]>;
}
