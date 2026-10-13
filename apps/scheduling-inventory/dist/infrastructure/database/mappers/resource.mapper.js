import { ResourceEntity } from '../../../domain/entities/resource.entity.js';
export class ResourceMapper {
    static toDomain(doc) {
        return new ResourceEntity({
            id: doc._id,
            tenantId: doc.tenant_id,
            resourceType: doc.resource_type,
            name: doc.name,
            title: doc.title,
            category: doc.category,
            description: doc.description,
            isBookable: doc.is_bookable,
            dispatchStatus: doc.dispatch_status,
            customShiftOverridesJson: doc.custom_shift_overrides_json ?? '{}',
            createdAt: doc.created_at,
            updatedAt: doc.updated_at,
        });
    }
    static toPersistence(entity) {
        return {
            _id: entity.id,
            tenant_id: entity.tenantId,
            resource_type: entity.resourceType,
            name: entity.name,
            title: entity.title,
            category: entity.category,
            description: entity.description,
            is_bookable: entity.isBookable,
            dispatch_status: entity.dispatchStatus,
            custom_shift_overrides_json: entity.customShiftOverridesJson,
        };
    }
    static toProto(entity) {
        return {
            resource_id: entity.id,
            tenant_id: entity.tenantId,
            resource_type: entity.resourceType,
            name: entity.name,
            title: entity.title,
            category: entity.category,
            description: entity.description,
            is_bookable: entity.isBookable,
            dispatch_status: entity.dispatchStatus,
            custom_shift_overrides_json: entity.customShiftOverridesJson,
            created_at: entity.createdAt.toISOString(),
            updated_at: entity.updatedAt.toISOString(),
        };
    }
}
