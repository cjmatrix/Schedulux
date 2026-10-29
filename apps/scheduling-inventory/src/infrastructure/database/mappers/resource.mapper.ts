import { ResourceInfo } from '@repo/proto/scheduling';
import {
  DispatchStatus,
  ResourceEntity,
  ResourceType,
} from '../../../domain/entities/resource.entity.js';
import { IResourceDoc } from '../schemas/resource.schema.js';

export class ResourceMapper {
  static toDomain(doc: IResourceDoc): ResourceEntity {
    return new ResourceEntity({
      id: doc._id,
      tenantId: doc.tenant_id,
      agentId: doc.agent_id,
      resourceType: doc.resource_type as ResourceType,
      name: doc.name,
      title: doc.title,
      category: doc.category,
      description: doc.description,
      isBookable: doc.is_bookable,
      dispatchStatus: doc.dispatch_status as DispatchStatus,
      customShiftOverridesJson: doc.custom_shift_overrides_json ?? '{}',
      isDeleted: doc.is_deleted ?? false,
      deletedAt: doc.deleted_at ?? null,
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
    });
  }

  static toPersistence(entity: ResourceEntity): Partial<IResourceDoc> {
    return {
      _id: entity.id,
      tenant_id: entity.tenantId,
      agent_id: entity.agentId,
      resource_type: entity.resourceType,
      name: entity.name,
      title: entity.title,
      category: entity.category,
      description: entity.description,
      is_bookable: entity.isBookable,
      dispatch_status: entity.dispatchStatus,
      custom_shift_overrides_json: entity.customShiftOverridesJson,
      is_deleted: entity.isDeleted,
      deleted_at: entity.deletedAt,
    };
  }

  static toProto(entity: ResourceEntity): ResourceInfo {
    return {
      resource_id: entity.id,
      tenant_id: entity.tenantId,
      agent_id: entity.agentId,
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
      is_deleted: entity.isDeleted,
      deleted_at: entity.deletedAt ? entity.deletedAt.toISOString() : undefined,
    };
  }
}
