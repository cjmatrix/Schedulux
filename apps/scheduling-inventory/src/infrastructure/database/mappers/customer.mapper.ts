import { CustomerEntity } from '../../../domain/entities/customer.entity.js';
import { ICustomerDoc } from '../schemas/customer.schema.js';

export class CustomerMapper {
  static toDomain(doc: ICustomerDoc): CustomerEntity {
    return new CustomerEntity({
      id: doc._id,
      tenantId: doc.tenant_id,
      agentId: doc.agent_id ?? '',
      name: doc.name,
      phone: doc.phone,
      email: doc.email ?? '',
      notes: doc.notes ?? '',
      isGuest: doc.is_guest ?? false,
      totalBookings: doc.total_bookings ?? 0,
      isDeleted: doc.is_deleted ?? false,
      deletedAt: doc.deleted_at ?? null,
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
    });
  }

  static toPersistence(entity: CustomerEntity): Partial<ICustomerDoc> {
    return {
      _id: entity.id,
      tenant_id: entity.tenantId,
      agent_id: entity.agentId,
      name: entity.name,
      phone: entity.phone,
      email: entity.email,
      notes: entity.notes,
      is_guest: entity.isGuest,
      total_bookings: entity.totalBookings,
      is_deleted: entity.isDeleted,
      deleted_at: entity.deletedAt,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }
}
