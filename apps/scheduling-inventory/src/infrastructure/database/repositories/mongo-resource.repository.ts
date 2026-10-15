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
    const doc = await ResourceModel.findOne({
      _id: resourceId,
      tenant_id: tenantId,
      is_deleted: { $ne: true },
    }).exec();
    if (!doc) return null;
    return ResourceMapper.toDomain(doc);
  }

  async findAll(
    tenantId: string,
    filter: FindResourcesFilter,
  ): Promise<{ resources: ResourceEntity[]; total: number }> {
    const query: Record<string, any> = {
      tenant_id: tenantId,
      is_deleted: { $ne: true },
    };
    if (filter.resourceType) {
      query.resource_type = filter.resourceType;
    }
    if (filter.dispatchStatus) {
      query.dispatch_status = filter.dispatchStatus;
    }
    if (filter.agentId) {
      query.agent_id = filter.agentId;
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
      { _id: resource.id, tenant_id: resource.tenantId, is_deleted: { $ne: true } },
      { $set: persistenceData },
      { new: true },
    ).exec();

    if (!updated) return null;
    return ResourceMapper.toDomain(updated);
  }

  async delete(tenantId: string, resourceId: string): Promise<boolean> {
    const result = await ResourceModel.updateOne(
      { _id: resourceId, tenant_id: tenantId, is_deleted: { $ne: true } },
      { $set: { is_deleted: true, deleted_at: new Date() } },
    ).exec();
    return (result.modifiedCount ?? 0) > 0;
  }

  async bulkUpsert(resources: ResourceEntity[]): Promise<ResourceEntity[]> {
    if (!resources.length) return [];
    const ops = resources.map((r) => {
      const data = ResourceMapper.toPersistence(r);
      return {
        updateOne: {
          filter: { _id: r.id, tenant_id: r.tenantId },
          update: { $set: data },
          upsert: true,
        },
      };
    });
    await ResourceModel.bulkWrite(ops);
    return resources;
  }

  async findByTenant(tenantId: string, agentId?: string): Promise<ResourceEntity[]> {
    const query: Record<string, any> = {
      tenant_id: tenantId,
      is_deleted: { $ne: true },
    };
    if (agentId) {
      query.agent_id = agentId;
    }
    const docs = await ResourceModel.find(query).exec();
    return docs.map((doc) => ResourceMapper.toDomain(doc));
  }
}
