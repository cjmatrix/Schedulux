import type { ClientSession } from 'mongoose';
import type { BookingEntity } from '../../domain/entities/booking.entity.js';
import type { ResourceEntity } from '../../domain/entities/resource.entity.js';
import type { ServiceEntity } from '../../domain/entities/service.entity.js';
import type { IOutboxDoc } from '../../infrastructure/database/schemas/outbox.schema.js';
import type { ITenantScheduleDoc } from '../../infrastructure/database/schemas/tenant-schedule.schema.js';

export interface ISchedulingEventsProducer {
  createServiceCreatedOutboxEvent(
    entity: ServiceEntity,
    session?: ClientSession,
  ): Promise<IOutboxDoc>;
  createServiceUpdatedOutboxEvent(
    entity: ServiceEntity,
    session?: ClientSession,
  ): Promise<IOutboxDoc>;
  createServiceDeletedOutboxEvent(
    tenantId: string,
    agentId: string,
    serviceId: string,
    session?: ClientSession,
  ): Promise<IOutboxDoc>;

  createResourceCreatedOutboxEvent(
    entity: ResourceEntity,
    session?: ClientSession,
  ): Promise<IOutboxDoc>;
  createResourceUpdatedOutboxEvent(
    entity: ResourceEntity,
    session?: ClientSession,
  ): Promise<IOutboxDoc>;
  createResourceDeletedOutboxEvent(
    tenantId: string,
    agentId: string,
    resourceId: string,
    session?: ClientSession,
  ): Promise<IOutboxDoc>;

  createBookingCreatedOutboxEvent(
    entity: BookingEntity,
    session?: ClientSession,
  ): Promise<IOutboxDoc>;
  createBookingCancelledOutboxEvent(
    entity: BookingEntity,
    reason?: string,
    session?: ClientSession,
  ): Promise<IOutboxDoc>;
  createBookingRescheduledOutboxEvent(
    entity: BookingEntity,
    previousStartTime: Date,
    previousEndTime: Date,
    session?: ClientSession,
  ): Promise<IOutboxDoc>;

  createScheduleUpdatedOutboxEvent(
    doc: ITenantScheduleDoc,
    session?: ClientSession,
  ): Promise<IOutboxDoc>;

  publishOutboxEvent(outboxDoc: IOutboxDoc): Promise<void>;

  emitServiceCreated(entity: ServiceEntity): Promise<void>;
  emitServiceUpdated(entity: ServiceEntity): Promise<void>;
  emitServiceDeleted(tenantId: string, agentId: string, serviceId: string): Promise<void>;

  emitResourceCreated(entity: ResourceEntity): Promise<void>;
  emitResourceUpdated(entity: ResourceEntity): Promise<void>;
  emitResourceDeleted(tenantId: string, agentId: string, resourceId: string): Promise<void>;

  emitBookingCreated(entity: BookingEntity): Promise<void>;
  emitBookingCancelled(entity: BookingEntity, reason?: string): Promise<void>;
  emitBookingRescheduled(
    entity: BookingEntity,
    previousStartTime: Date,
    previousEndTime: Date,
  ): Promise<void>;
}
