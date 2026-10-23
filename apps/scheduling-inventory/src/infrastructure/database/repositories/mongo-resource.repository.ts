import { Inject, Injectable } from '@nestjs/common';
import { ResourceEntity } from '../../../domain/entities/resource.entity.js';
import {
  FindResourcesFilter,
  IResourceRepository,
  ResourceSummary,
} from '../../../domain/repositories/resource.repository.interface.js';
import type { IUnitOfWork } from '../../../domain/repositories/unit-of-work.interface.js';
import { UNIT_OF_WORK } from '../../../domain/tokens.js';
import { ResourceMapper } from '../mappers/resource.mapper.js';
import { ResourceModel } from '../schemas/resource.schema.js';

@Injectable()
export class MongoResourceRepository implements IResourceRepository {
  constructor(
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async create(resource: ResourceEntity): Promise<ResourceEntity> {
    const session = this.unitOfWork?.getSession();
    const persistenceData = ResourceMapper.toPersistence(resource);
    if (session) {
      const [created] = await ResourceModel.create([persistenceData], { session });
      return ResourceMapper.toDomain(created);
    }
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
  ): Promise<{ resources: ResourceEntity[]; total: number; summary?: ResourceSummary }> {
    const baseMatch: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: { $ne: true },
    };
    if (filter.agentId) {
      baseMatch.agent_id = filter.agentId;
    }

    const query: Record<string, unknown> = { ...baseMatch };
    if (filter.resourceType) {
      query.resource_type = filter.resourceType;
    }
    if (filter.dispatchStatus) {
      query.dispatch_status = filter.dispatchStatus;
    }
    if (filter.category) {
      query.category = filter.category;
    }
    if (filter.search?.trim()) {
      const searchRegex = new RegExp(
        filter.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i',
      );
      query.$or = [
        { name: searchRegex },
        { title: searchRegex },
        { category: searchRegex },
        { resource_type: searchRegex },
        { description: searchRegex },
        { _id: searchRegex },
      ];
    }

    const page = Math.max(1, filter.page || 1);
    const limit = Math.max(1, Math.min(100, filter.limit || 20));
    const skip = (page - 1) * limit;

    const [docs, total, statsResult] = await Promise.all([
      ResourceModel.find(query).sort({ created_at: -1 }).skip(skip).limit(limit).exec(),
      ResourceModel.countDocuments(query).exec(),
      ResourceModel.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: null,
            totalCount: { $sum: 1 },
            activeCount: {
              $sum: { $cond: [{ $eq: ['$dispatch_status', 'active'] }, 1, 0] },
            },
            staffCount: {
              $sum: { $cond: [{ $eq: ['$resource_type', 'staff'] }, 1, 0] },
            },
            physicalCount: {
              $sum: { $cond: [{ $ne: ['$resource_type', 'staff'] }, 1, 0] },
            },
          },
        },
      ]).exec(),
    ]);

    const stat = statsResult[0] || {};
    const summary: ResourceSummary = {
      totalCount: stat.totalCount ?? 0,
      activeCount: stat.activeCount ?? 0,
      staffCount: stat.staffCount ?? 0,
      physicalCount: stat.physicalCount ?? 0,
    };

    return {
      resources: docs.map((doc) => ResourceMapper.toDomain(doc)),
      total,
      summary,
    };
  }

  async update(resource: ResourceEntity): Promise<ResourceEntity | null> {
    const session = this.unitOfWork?.getSession();
    const persistenceData = ResourceMapper.toPersistence(resource);
    const updated = await ResourceModel.findOneAndUpdate(
      { _id: resource.id, tenant_id: resource.tenantId, is_deleted: { $ne: true } },
      { $set: persistenceData },
      { new: true, session },
    ).exec();

    if (!updated) return null;
    return ResourceMapper.toDomain(updated);
  }

  async delete(tenantId: string, resourceId: string): Promise<boolean> {
    const session = this.unitOfWork?.getSession();
    const result = await ResourceModel.updateOne(
      { _id: resourceId, tenant_id: tenantId, is_deleted: { $ne: true } },
      { $set: { is_deleted: true, deleted_at: new Date() } },
      { session },
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
    const query: Record<string, unknown> = {
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
