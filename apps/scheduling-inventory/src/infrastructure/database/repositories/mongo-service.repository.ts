import { Inject, Injectable } from '@nestjs/common';
import { ServiceEntity } from '../../../domain/entities/service.entity.js';
import {
  FindServicesFilter,
  IServiceRepository,
  ServiceSummary,
} from '../../../domain/repositories/service.repository.interface.js';
import type { IUnitOfWork } from '../../../domain/repositories/unit-of-work.interface.js';
import { UNIT_OF_WORK } from '../../../domain/tokens.js';
import { ServiceMapper } from '../mappers/service.mapper.js';
import { ServiceModel } from '../schemas/service.schema.js';

@Injectable()
export class MongoServiceRepository implements IServiceRepository {
  constructor(
    @Inject(UNIT_OF_WORK)
    private readonly _unitOfWork: IUnitOfWork,
  ) {}

  async create(service: ServiceEntity): Promise<ServiceEntity> {
    const session = this._unitOfWork?.getSession();
    const persistenceData = ServiceMapper.toPersistence(service);
    if (session) {
      const [created] = await ServiceModel.create([persistenceData], { session });
      return ServiceMapper.toDomain(created);
    }
    const created = await ServiceModel.create(persistenceData);
    return ServiceMapper.toDomain(created);
  }

  async findById(tenantId: string, serviceId: string): Promise<ServiceEntity | null> {
    const doc = await ServiceModel.findOne({
      _id: serviceId,
      tenant_id: tenantId,
      is_deleted: { $ne: true },
    }).exec();
    if (!doc) return null;
    return ServiceMapper.toDomain(doc);
  }

  async findAll(
    tenantId: string,
    filter: FindServicesFilter,
  ): Promise<{ services: ServiceEntity[]; total: number; summary?: ServiceSummary }> {
    const baseMatch: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: { $ne: true },
    };
    if (filter.agentId) {
      baseMatch.agent_id = filter.agentId;
    }

    const query: Record<string, unknown> = { ...baseMatch };
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
        { category: searchRegex },
        { description: searchRegex },
        { _id: searchRegex },
      ];
    }

    const page = Math.max(1, filter.page || 1);
    const limit = Math.max(1, Math.min(100, filter.limit || 20));
    const skip = (page - 1) * limit;

    const [docs, total, statsResult] = await Promise.all([
      ServiceModel.find(query).sort({ created_at: -1 }).skip(skip).limit(limit).exec(),
      ServiceModel.countDocuments(query).exec(),
      ServiceModel.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: null,
            totalCount: { $sum: 1 },
            avgPrice: { $avg: '$price.amount' },
            depositCount: {
              $sum: { $cond: [{ $eq: ['$deposit.required', true] }, 1, 0] },
            },
            categories: { $addToSet: '$category' },
          },
        },
      ]).exec(),
    ]);

    const stat =
      (statsResult[0] as {
        totalCount?: number;
        avgPrice?: number;
        depositCount?: number;
        categories?: unknown[];
      }) || {};
    const summary: ServiceSummary = {
      totalCount: stat.totalCount ?? 0,
      avgPrice: stat.avgPrice ? Number(stat.avgPrice.toFixed(2)) : 0,
      depositCount: stat.depositCount ?? 0,
      categories: (stat.categories ?? []).filter(
        (c: unknown): c is string => typeof c === 'string' && c.trim().length > 0,
      ),
    };

    return {
      services: docs.map((doc) => ServiceMapper.toDomain(doc)),
      total,
      summary,
    };
  }

  async update(service: ServiceEntity): Promise<ServiceEntity | null> {
    const session = this._unitOfWork?.getSession();
    const persistenceData = ServiceMapper.toPersistence(service);
    const updated = await ServiceModel.findOneAndUpdate(
      { _id: service.id, tenant_id: service.tenantId, is_deleted: { $ne: true } },
      { $set: persistenceData },
      { new: true, session },
    ).exec();

    if (!updated) return null;
    return ServiceMapper.toDomain(updated);
  }

  async delete(tenantId: string, serviceId: string): Promise<boolean> {
    const session = this._unitOfWork?.getSession();
    const result = await ServiceModel.updateOne(
      { _id: serviceId, tenant_id: tenantId, is_deleted: { $ne: true } },
      { $set: { is_deleted: true, deleted_at: new Date() } },
      { session },
    ).exec();
    return (result.modifiedCount ?? 0) > 0;
  }

  async bulkUpsert(services: ServiceEntity[]): Promise<ServiceEntity[]> {
    if (!services.length) return [];
    const ops = services.map((s) => {
      const data = ServiceMapper.toPersistence(s);
      return {
        updateOne: {
          filter: { _id: s.id, tenant_id: s.tenantId },
          update: { $set: data },
          upsert: true,
        },
      };
    });
    await ServiceModel.bulkWrite(ops);
    return services;
  }

  async findByTenant(tenantId: string, agentId?: string): Promise<ServiceEntity[]> {
    const query: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: { $ne: true },
    };
    if (agentId) {
      query.agent_id = agentId;
    }
    const docs = await ServiceModel.find(query).exec();
    return docs.map((doc) => ServiceMapper.toDomain(doc));
  }
}
