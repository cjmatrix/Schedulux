import { Injectable } from '@nestjs/common';
import { IServiceRepository, FindServicesFilter } from '../../../domain/repositories/service.repository.interface.js';
import { ServiceEntity } from '../../../domain/entities/service.entity.js';
import { ServiceModel, IServiceDoc } from '../schemas/service.schema.js';
import { ServiceMapper } from '../mappers/service.mapper.js';

@Injectable()
export class MongoServiceRepository implements IServiceRepository {
  async create(service: ServiceEntity): Promise<ServiceEntity> {
    const persistenceData = ServiceMapper.toPersistence(service);
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
  ): Promise<{ services: ServiceEntity[]; total: number }> {
    const query: Record<string, any> = {
      tenant_id: tenantId,
      is_deleted: { $ne: true },
    };
    if (filter.category) {
      query.category = filter.category;
    }
    if (filter.agentId) {
      query.agent_id = filter.agentId;
    }

    const page = Math.max(1, filter.page || 1);
    const limit = Math.max(1, Math.min(100, filter.limit || 20));
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      ServiceModel.find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      ServiceModel.countDocuments(query).exec(),
    ]);

    return {
      services: docs.map((doc) => ServiceMapper.toDomain(doc)),
      total,
    };
  }

  async update(service: ServiceEntity): Promise<ServiceEntity | null> {
    const persistenceData = ServiceMapper.toPersistence(service);
    const updated = await ServiceModel.findOneAndUpdate(
      { _id: service.id, tenant_id: service.tenantId, is_deleted: { $ne: true } },
      { $set: persistenceData },
      { new: true },
    ).exec();

    if (!updated) return null;
    return ServiceMapper.toDomain(updated);
  }

  async delete(tenantId: string, serviceId: string): Promise<boolean> {
    const result = await ServiceModel.updateOne(
      { _id: serviceId, tenant_id: tenantId, is_deleted: { $ne: true } },
      { $set: { is_deleted: true, deleted_at: new Date() } },
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
    const query: Record<string, any> = {
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
