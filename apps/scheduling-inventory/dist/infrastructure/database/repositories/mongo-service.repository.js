var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
import { ServiceModel } from '../schemas/service.schema.js';
import { ServiceMapper } from '../mappers/service.mapper.js';
let MongoServiceRepository = class MongoServiceRepository {
    async create(service) {
        const persistenceData = ServiceMapper.toPersistence(service);
        const created = await ServiceModel.create(persistenceData);
        return ServiceMapper.toDomain(created);
    }
    async findById(tenantId, serviceId) {
        const doc = await ServiceModel.findOne({ _id: serviceId, tenant_id: tenantId }).exec();
        if (!doc)
            return null;
        return ServiceMapper.toDomain(doc);
    }
    async findAll(tenantId, filter) {
        const query = { tenant_id: tenantId };
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
    async update(service) {
        const persistenceData = ServiceMapper.toPersistence(service);
        const updated = await ServiceModel.findOneAndUpdate({ _id: service.id, tenant_id: service.tenantId }, { $set: persistenceData }, { new: true }).exec();
        if (!updated)
            return null;
        return ServiceMapper.toDomain(updated);
    }
    async delete(tenantId, serviceId) {
        const result = await ServiceModel.deleteOne({ _id: serviceId, tenant_id: tenantId }).exec();
        return (result.deletedCount ?? 0) > 0;
    }
};
MongoServiceRepository = __decorate([
    Injectable()
], MongoServiceRepository);
export { MongoServiceRepository };
