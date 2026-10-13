var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
import { ResourceModel } from '../schemas/resource.schema.js';
import { ResourceMapper } from '../mappers/resource.mapper.js';
let MongoResourceRepository = class MongoResourceRepository {
    async create(resource) {
        const persistenceData = ResourceMapper.toPersistence(resource);
        const created = await ResourceModel.create(persistenceData);
        return ResourceMapper.toDomain(created);
    }
    async findById(tenantId, resourceId) {
        const doc = await ResourceModel.findOne({ _id: resourceId, tenant_id: tenantId }).exec();
        if (!doc)
            return null;
        return ResourceMapper.toDomain(doc);
    }
    async findAll(tenantId, filter) {
        const query = { tenant_id: tenantId };
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
    async update(resource) {
        const persistenceData = ResourceMapper.toPersistence(resource);
        const updated = await ResourceModel.findOneAndUpdate({ _id: resource.id, tenant_id: resource.tenantId }, { $set: persistenceData }, { new: true }).exec();
        if (!updated)
            return null;
        return ResourceMapper.toDomain(updated);
    }
    async delete(tenantId, resourceId) {
        const result = await ResourceModel.deleteOne({ _id: resourceId, tenant_id: tenantId }).exec();
        return (result.deletedCount ?? 0) > 0;
    }
};
MongoResourceRepository = __decorate([
    Injectable()
], MongoResourceRepository);
export { MongoResourceRepository };
