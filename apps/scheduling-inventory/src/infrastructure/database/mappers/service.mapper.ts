import { ServiceInfo } from '@repo/proto/scheduling';
import { ServiceEntity } from '../../../domain/entities/service.entity.js';
import { PriceVO } from '../../../domain/value-objects/price.vo.js';
import { IServiceDoc } from '../schemas/service.schema.js';

export class ServiceMapper {
  static toDomain(doc: IServiceDoc): ServiceEntity {
    return new ServiceEntity({
      id: doc._id,
      tenantId: doc.tenant_id,
      agentId: doc.agent_id,
      name: doc.name,
      category: doc.category,
      description: doc.description,
      durationMinutes: doc.duration_minutes,
      bufferMinutes: doc.buffer_minutes,
      bookingMode: doc.booking_mode ?? 'time_slot',
      price: PriceVO.create(doc.price?.type, doc.price?.amount, doc.price?.currency),
      verification: doc.verification ? { require_otp: doc.verification.require_otp } : undefined,
      resourceRequirements: (doc.resource_requirements ?? []).map((r) => ({
        role: r.role,
        resourceType: r.resource_type,
        count: r.count,
        eligibleResourceIds: r.eligible_resource_ids ?? [],
        selectionMode: r.selection_mode,
      })),
      isDeleted: doc.is_deleted ?? false,
      deletedAt: doc.deleted_at ?? null,
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
    });
  }

  static toPersistence(entity: ServiceEntity): Partial<IServiceDoc> {
    return {
      _id: entity.id,
      tenant_id: entity.tenantId,
      agent_id: entity.agentId,
      name: entity.name,
      category: entity.category,
      description: entity.description,
      duration_minutes: entity.durationMinutes,
      buffer_minutes: entity.bufferMinutes,
      booking_mode: entity.bookingMode,
      price: {
        type: entity.price.type,
        amount: entity.price.amount,
        currency: entity.price.currency,
      },
      verification: entity.verification
        ? { require_otp: entity.verification.require_otp ?? null }
        : undefined,
      resource_requirements: entity.resourceRequirements.map((r) => ({
        role: r.role,
        resource_type: r.resourceType,
        count: r.count,
        eligible_resource_ids: r.eligibleResourceIds,
        selection_mode: r.selectionMode,
      })),
      is_deleted: entity.isDeleted,
      deleted_at: entity.deletedAt,
    };
  }

  static toProto(entity: ServiceEntity): ServiceInfo {
    return {
      service_id: entity.id,
      tenant_id: entity.tenantId,
      agent_id: entity.agentId,
      name: entity.name,
      category: entity.category,
      description: entity.description,
      duration_minutes: entity.durationMinutes,
      buffer_minutes: entity.bufferMinutes,
      booking_mode: entity.bookingMode,
      price: {
        type: entity.price.type,
        amount: entity.price.amount,
        currency: entity.price.currency,
      },
      verification: entity.verification
        ? { require_otp: entity.verification.require_otp ?? undefined }
        : undefined,
      resource_requirements: entity.resourceRequirements.map((r) => ({
        role: r.role,
        resource_type: r.resourceType,
        count: r.count,
        eligible_resource_ids: r.eligibleResourceIds,
        selection_mode: r.selectionMode,
      })),
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString(),
      is_deleted: entity.isDeleted,
      deleted_at: entity.deletedAt ? entity.deletedAt.toISOString() : undefined,
    };
  }
}
