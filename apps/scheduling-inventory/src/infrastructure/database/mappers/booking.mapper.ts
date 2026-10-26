import { BookingInfo } from '@repo/proto/scheduling';
import {
  BookingDepositStatus,
  BookingEntity,
  BookingMode,
  BookingSource,
  BookingStatus,
} from '../../../domain/entities/booking.entity.js';
import { DepositVO } from '../../../domain/value-objects/deposit.vo.js';
import { PriceVO } from '../../../domain/value-objects/price.vo.js';
import { IBookingDoc } from '../schemas/booking.schema.js';

export class BookingMapper {
  static toDomain(doc: IBookingDoc): BookingEntity {
    return new BookingEntity({
      id: doc._id,
      bookingReference: doc.booking_reference,
      tenantId: doc.tenant_id,
      agentId: doc.agent_id ?? '',
      serviceId: doc.service_id,
      resourceId: doc.resource_id ?? null,
      resourceIds: doc.resource_ids ?? (doc.resource_id ? [doc.resource_id] : []),
      assignedAssetIds: doc.assigned_asset_ids ?? [],
      customerId: doc.customer_id,
      customerSnapshot: {
        name: doc.customer_snapshot?.name ?? 'Guest',
        phone: doc.customer_snapshot?.phone ?? '',
        email: doc.customer_snapshot?.email ?? '',
      },
      bookingMode: (doc.booking_mode as BookingMode) ?? 'time_slot',
      startTime: doc.start_time,
      endTime: doc.end_time,
      effectiveEndTime: doc.effective_end_time,
      bufferMinutes: doc.buffer_minutes,
      durationMinutes: doc.duration_minutes,
      source: (doc.source as BookingSource) ?? 'manual',
      status: (doc.status as BookingStatus) ?? 'confirmed',
      depositStatus: (doc.deposit_status as BookingDepositStatus) ?? 'not_required',
      price: PriceVO.create(doc.price?.type, doc.price?.amount, doc.price?.currency),
      deposit: DepositVO.create({
        required: doc.deposit?.required,
        amount: doc.deposit?.amount,
        processor: doc.deposit?.processor,
        upiId: doc.deposit?.upi_id,
        qrCodeUrl: doc.deposit?.qr_code_url,
        confirmationMethod: doc.deposit?.confirmation_method,
        paymentInstructions: doc.deposit?.payment_instructions,
      }),
      notes: doc.notes ?? '',
      createdBy: doc.created_by ?? '',
      isDeleted: doc.is_deleted ?? false,
      deletedAt: doc.deleted_at ?? null,
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
    });
  }

  static toPersistence(entity: BookingEntity): Partial<IBookingDoc> {
    return {
      _id: entity.id,
      booking_reference: entity.bookingReference,
      tenant_id: entity.tenantId,
      agent_id: entity.agentId,
      service_id: entity.serviceId,
      resource_id: entity.resourceId,
      resource_ids: entity.resourceIds,
      assigned_asset_ids: entity.assignedAssetIds,
      customer_id: entity.customerId,
      customer_snapshot: {
        name: entity.customerSnapshot.name,
        phone: entity.customerSnapshot.phone,
        email: entity.customerSnapshot.email ?? '',
      },
      booking_mode: entity.bookingMode,
      start_time: entity.startTime,
      end_time: entity.endTime,
      effective_end_time: entity.effectiveEndTime,
      buffer_minutes: entity.bufferMinutes,
      duration_minutes: entity.durationMinutes,
      source: entity.source,
      status: entity.status,
      deposit_status: entity.depositStatus,
      price: {
        type: entity.price.type,
        amount: entity.price.amount,
        currency: entity.price.currency,
      },
      deposit: {
        required: entity.deposit.required,
        amount: entity.deposit.amount,
        processor: entity.deposit.processor,
        upi_id: entity.deposit.upiId,
        qr_code_url: entity.deposit.qrCodeUrl,
        confirmation_method: entity.deposit.confirmationMethod,
        payment_instructions: entity.deposit.paymentInstructions,
      },
      notes: entity.notes,
      created_by: entity.createdBy,
      is_deleted: entity.isDeleted,
      deleted_at: entity.deletedAt,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }

  static toProto(entity: BookingEntity): BookingInfo {
    return {
      booking_id: entity.id,
      booking_reference: entity.bookingReference,
      tenant_id: entity.tenantId,
      agent_id: entity.agentId,
      service_id: entity.serviceId,
      resource_id: entity.resourceId ?? undefined,
      resource_ids: entity.resourceIds,
      customer_id: entity.customerId,
      customer: {
        name: entity.customerSnapshot.name,
        phone: entity.customerSnapshot.phone,
        email: entity.customerSnapshot.email || undefined,
      },
      booking_mode: entity.bookingMode,
      start_time: entity.startTime.toISOString(),
      end_time: entity.endTime.toISOString(),
      effective_end_time: entity.effectiveEndTime.toISOString(),
      buffer_minutes: entity.bufferMinutes,
      duration_minutes: entity.durationMinutes,
      source: entity.source,
      status: entity.status,
      deposit_status: entity.depositStatus,
      price: {
        type: entity.price.type,
        amount: entity.price.amount,
        currency: entity.price.currency,
      },
      deposit: {
        required: entity.deposit.required,
        amount: entity.deposit.amount,
        processor: entity.deposit.processor,
        upi_id: entity.deposit.upiId,
        qr_code_url: entity.deposit.qrCodeUrl,
        confirmation_method: entity.deposit.confirmationMethod,
        payment_instructions: entity.deposit.paymentInstructions,
      },
      notes: entity.notes || undefined,
      created_by: entity.createdBy || undefined,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString(),
    };
  }
}
