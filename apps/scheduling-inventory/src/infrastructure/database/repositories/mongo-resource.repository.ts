import { Injectable } from '@nestjs/common';
import { IResourceRepository, FindResourcesFilter } from '../../../domain/repositories/resource.repository.interface.js';
import { ResourceEntity } from '../../../domain/entities/resource.entity.js';
import { ResourceModel, IResourceDoc } from '../schemas/resource.schema.js';
import { ResourceMapper } from '../mappers/resource.mapper.js';

@Injectable()
export class MongoResourceRepository implements IResourceRepository {
  async create(resource: ResourceEntity): Promise<ResourceEntity> {
    const persistenceData = ResourceMapper.toPersistence(resource);
    const created = await ResourceModel.create(persistenceData);
    return ResourceMapper.toDomain(created);
  }

  async findById(tenantId: string, resourceId: string): Promise<ResourceEntity | null> {
    const doc = await ResourceModel.findOne({ _id: resourceId, tenant_id: tenantId }).exec();
    if (!doc) return null;
    return ResourceMapper.toDomain(doc);
  }

  async findAll(
    tenantId: string,
    filter: FindResourcesFilter,
  ): Promise<{ resources: ResourceEntity[]; total: number }> {
    const query: Record<string, any> = { tenant_id: tenantId };
    if (filter.resourceType) {
      query.resource_type = filter.resourceType;
    }
    if (filter.dispatchStatus) {
      query.dispatch_status = filter.dispatchStatus;
    }

    const page = Math.max(1, filter.page || 1);
    const limit = Math.max(1, Math.min(100, filter.limit || 20));
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      ResourceModel.find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      ResourceModel.countDocuments(query).exec(),
    ]);

    return {
      resources: docs.map((doc) => ResourceMapper.toDomain(doc)),
      total,
    };
  }

  async update(resource: ResourceEntity): Promise<ResourceEntity | null> {
    const persistenceData = ResourceMapper.toPersistence(resource);
    const updated = await ResourceModel.findOneAndUpdate(
      { _id: resource.id, tenant_id: resource.tenantId },
      { $set: persistenceData },
      { new: true },
    ).exec();

    if (!updated) return null;
    return ResourceMapper.toDomain(updated);
  }

  async delete(tenantId: string, resourceId: string): Promise<boolean> {
    const result = await ResourceModel.deleteOne({ _id: resourceId, tenant_id: tenantId }).exec();
    return (result.deletedCount ?? 0) > 0;
  }
}
