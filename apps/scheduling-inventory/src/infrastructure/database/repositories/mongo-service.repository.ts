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
    const doc = await ServiceModel.findOne({ _id: serviceId, tenant_id: tenantId }).exec();
    if (!doc) return null;
    return ServiceMapper.toDomain(doc);
  }

  async findAll(
    tenantId: string,
    filter: FindServicesFilter,
  ): Promise<{ services: ServiceEntity[]; total: number }> {
    const query: Record<string, any> = { tenant_id: tenantId };
    if (filter.category) {
      query.category = filter.category;
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
      { _id: service.id, tenant_id: service.tenantId },
      { $set: persistenceData },
      { new: true },
    ).exec();

    if (!updated) return null;
    return ServiceMapper.toDomain(updated);
  }

  async delete(tenantId: string, serviceId: string): Promise<boolean> {
    const result = await ServiceModel.deleteOne({ _id: serviceId, tenant_id: tenantId }).exec();
    return (result.deletedCount ?? 0) > 0;
  }
}
