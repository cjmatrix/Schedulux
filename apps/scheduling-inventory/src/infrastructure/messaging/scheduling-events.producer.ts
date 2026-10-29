import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import type { DepositInfo, PriceInfo, ServiceVerificationInfo } from '@repo/proto/scheduling';
import type { ClientSession } from 'mongoose';
import type { ISchedulingEventsProducer } from '../../application/interfaces/scheduling-events-producer.interface.js';
import { BookingEntity } from '../../domain/entities/booking.entity.js';
import { ResourceEntity } from '../../domain/entities/resource.entity.js';
import { ServiceEntity } from '../../domain/entities/service.entity.js';
import type { IOutboxRepository } from '../../domain/repositories/outbox.repository.interface.js';
import { MESSAGING_SERVICE, OUTBOX_REPOSITORY } from '../../domain/tokens.js';
import { IOutboxDoc } from '../database/schemas/outbox.schema.js';

export const KAFKA_SERVICE_TOPIC_SERVICES = 'scheduling.service.events';
export const KAFKA_SERVICE_TOPIC_RESOURCES = 'scheduling.resource.events';
export const KAFKA_SERVICE_TOPIC_BOOKINGS = 'scheduling.booking.events';

export type SchedulingEventType =
  | 'service.created'
  | 'service.updated'
  | 'service.deleted'
  | 'resource.created'
  | 'resource.updated'
  | 'resource.deleted'
  | 'booking.created';


export interface BaseSchedulingEventPayload {
  [key: string]: unknown;
  event_id: string;
  event_type: SchedulingEventType;
  tenant_id: string;
  agent_id: string;
  version: number;
  timestamp: string;
}

export interface ServiceEventPayload extends BaseSchedulingEventPayload {
  service_id: string;

  data?: {
    name: string;
    category: string;
    description: string;
    duration_minutes: number;
    buffer_minutes: number;
    booking_mode: string;
    price: PriceInfo;
    deposit: DepositInfo;
    verification?: ServiceVerificationInfo;
    resource_requirements?: Array<{
      role: string;
      resource_type: string;
      count: number;
      eligible_resource_ids: string[];
      selection_mode?: string;
    }>;
    recall_interval_days: number;
    created_at: string;
    updated_at: string;
  };
}

export interface ResourceEventPayload extends BaseSchedulingEventPayload {
  resource_id: string;

  data?: {
    resource_type: string;
    name: string;
    title: string;
    category: string;
    description: string;
    is_bookable: boolean;
    dispatch_status: string;
    custom_shift_overrides: Record<string, unknown>;
    created_at: string;
    updated_at: string;
  };
}

export interface BookingEventPayload extends BaseSchedulingEventPayload {
  booking_id: string;
  data?: {
    booking_reference: string;
    service_id: string;
    resource_id?: string | null;
    resource_ids?: string[];
    assigned_asset_ids?: string[];
    customer_id: string;
    customer_name: string;
    customer_phone: string;
    booking_mode: string;
    start_time: string;
    end_time: string;
    effective_end_time?: string;
    buffer_minutes?: number;
    duration_minutes: number;
    source: string;
    status: string;
    deposit_status: string;
    price: { amount: number; currency: string };
    created_at: string;
  };
}

@Injectable()
export class SchedulingEventsProducer implements ISchedulingEventsProducer {
  private readonly _logger = new Logger(SchedulingEventsProducer.name);

  constructor(
    @Inject(MESSAGING_SERVICE)
    private readonly _messagingClient: ClientProxy,
    @Inject(OUTBOX_REPOSITORY)
    private readonly _outboxRepository: IOutboxRepository,
  ) {}

  async createServiceCreatedOutboxEvent(
    entity: ServiceEntity,
    session?: ClientSession,
  ): Promise<IOutboxDoc> {
    const version = entity.updatedAt ? entity.updatedAt.getTime() : Date.now();
    const eventId = `evt_srv_${entity.id}_${version}`;
    const payload: ServiceEventPayload = {
      event_id: eventId,
      event_type: 'service.created',
      tenant_id: entity.tenantId,
      agent_id: entity.agentId,
      service_id: entity.id,
      version,
      timestamp: new Date().toISOString(),
      data: this._buildServiceSnapshot(entity),
    };

    return this._outboxRepository.saveEvent(
      {
        eventId,
        aggregateType: 'service',
        aggregateId: entity.id,
        eventType: 'service.created',
        topic: KAFKA_SERVICE_TOPIC_SERVICES,
        partitionKey: entity.agentId || entity.tenantId,
        payload,
      },
      session,
    );
  }

  async createServiceUpdatedOutboxEvent(
    entity: ServiceEntity,
    session?: ClientSession,
  ): Promise<IOutboxDoc> {
    const version = entity.updatedAt ? entity.updatedAt.getTime() : Date.now();
    const eventId = `evt_srv_${entity.id}_${version}`;
    const payload: ServiceEventPayload = {
      event_id: eventId,
      event_type: 'service.updated',
      tenant_id: entity.tenantId,
      agent_id: entity.agentId,
      service_id: entity.id,
      version,
      timestamp: new Date().toISOString(),
      data: this._buildServiceSnapshot(entity),
    };

    return this._outboxRepository.saveEvent(
      {
        eventId,
        aggregateType: 'service',
        aggregateId: entity.id,
        eventType: 'service.updated',
        topic: KAFKA_SERVICE_TOPIC_SERVICES,
        partitionKey: entity.agentId || entity.tenantId,
        payload,
      },
      session,
    );
  }

  async createServiceDeletedOutboxEvent(
    tenantId: string,
    agentId: string,
    serviceId: string,
    session?: ClientSession,
  ): Promise<IOutboxDoc> {
    const version = Date.now();
    const eventId = `evt_srv_${serviceId}_del_${version}`;
    const payload: ServiceEventPayload = {
      event_id: eventId,
      event_type: 'service.deleted',
      tenant_id: tenantId,
      agent_id: agentId,
      service_id: serviceId,
      version,
      timestamp: new Date().toISOString(),
    };

    return this._outboxRepository.saveEvent(
      {
        eventId,
        aggregateType: 'service',
        aggregateId: serviceId,
        eventType: 'service.deleted',
        topic: KAFKA_SERVICE_TOPIC_SERVICES,
        partitionKey: agentId || tenantId,
        payload,
      },
      session,
    );
  }

  async createResourceCreatedOutboxEvent(
    entity: ResourceEntity,
    session?: ClientSession,
  ): Promise<IOutboxDoc> {
    const version = entity.updatedAt ? entity.updatedAt.getTime() : Date.now();
    const eventId = `evt_res_${entity.id}_${version}`;
    const payload: ResourceEventPayload = {
      event_id: eventId,
      event_type: 'resource.created',
      tenant_id: entity.tenantId,
      agent_id: entity.agentId,
      resource_id: entity.id,
      version,
      timestamp: new Date().toISOString(),
      data: this._buildResourceSnapshot(entity),
    };

    return this._outboxRepository.saveEvent(
      {
        eventId,
        aggregateType: 'resource',
        aggregateId: entity.id,
        eventType: 'resource.created',
        topic: KAFKA_SERVICE_TOPIC_RESOURCES,
        partitionKey: entity.agentId || entity.tenantId,
        payload,
      },
      session,
    );
  }

  async createResourceUpdatedOutboxEvent(
    entity: ResourceEntity,
    session?: ClientSession,
  ): Promise<IOutboxDoc> {
    const version = entity.updatedAt ? entity.updatedAt.getTime() : Date.now();
    const eventId = `evt_res_${entity.id}_${version}`;
    const payload: ResourceEventPayload = {
      event_id: eventId,
      event_type: 'resource.updated',
      tenant_id: entity.tenantId,
      agent_id: entity.agentId,
      resource_id: entity.id,
      version,
      timestamp: new Date().toISOString(),
      data: this._buildResourceSnapshot(entity),
    };

    return this._outboxRepository.saveEvent(
      {
        eventId,
        aggregateType: 'resource',
        aggregateId: entity.id,
        eventType: 'resource.updated',
        topic: KAFKA_SERVICE_TOPIC_RESOURCES,
        partitionKey: entity.agentId || entity.tenantId,
        payload,
      },
      session,
    );
  }

  async createResourceDeletedOutboxEvent(
    tenantId: string,
    agentId: string,
    resourceId: string,
    session?: ClientSession,
  ): Promise<IOutboxDoc> {
    const version = Date.now();
    const eventId = `evt_res_${resourceId}_del_${version}`;
    const payload: ResourceEventPayload = {
      event_id: eventId,
      event_type: 'resource.deleted',
      tenant_id: tenantId,
      agent_id: agentId,
      resource_id: resourceId,
      version,
      timestamp: new Date().toISOString(),
    };

    return this._outboxRepository.saveEvent(
      {
        eventId,
        aggregateType: 'resource',
        aggregateId: resourceId,
        eventType: 'resource.deleted',
        topic: KAFKA_SERVICE_TOPIC_RESOURCES,
        partitionKey: agentId || tenantId,
        payload,
      },
      session,
    );
  }

  async publishOutboxEvent(outboxDoc: IOutboxDoc): Promise<void> {
    try {
      const key = outboxDoc.partition_key;
      const value = JSON.stringify(outboxDoc.payload);
      this._messagingClient.emit(outboxDoc.topic, { key, value });
      await this._outboxRepository.markPublished([outboxDoc._id]);
      this._logger.log(
        `[Messaging] Emitted and marked PUBLISHED: ${outboxDoc._id} (${outboxDoc.event_type})`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this._logger.error(
        `[Messaging] Immediate publish failed for ${outboxDoc._id}: ${msg}. Retrying in background recovery sweep.`,
      );
    }
  }

  async emitServiceCreated(entity: ServiceEntity): Promise<void> {
    const outbox = await this.createServiceCreatedOutboxEvent(entity);
    await this.publishOutboxEvent(outbox);
  }

  async emitServiceUpdated(entity: ServiceEntity): Promise<void> {
    const outbox = await this.createServiceUpdatedOutboxEvent(entity);
    await this.publishOutboxEvent(outbox);
  }

  async emitServiceDeleted(tenantId: string, agentId: string, serviceId: string): Promise<void> {
    const outbox = await this.createServiceDeletedOutboxEvent(tenantId, agentId, serviceId);
    await this.publishOutboxEvent(outbox);
  }

  async emitResourceCreated(entity: ResourceEntity): Promise<void> {
    const outbox = await this.createResourceCreatedOutboxEvent(entity);
    await this.publishOutboxEvent(outbox);
  }

  async emitResourceUpdated(entity: ResourceEntity): Promise<void> {
    const outbox = await this.createResourceUpdatedOutboxEvent(entity);
    await this.publishOutboxEvent(outbox);
  }

  async emitResourceDeleted(tenantId: string, agentId: string, resourceId: string): Promise<void> {
    const outbox = await this.createResourceDeletedOutboxEvent(tenantId, agentId, resourceId);
    await this.publishOutboxEvent(outbox);
  }

  private _buildServiceSnapshot(entity: ServiceEntity): NonNullable<ServiceEventPayload['data']> {
    return {
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
      deposit: {
        required: entity.deposit.required,
        amount: entity.deposit.amount,
        processor: entity.deposit.processor,
        upi_id: entity.deposit.upiId,
        qr_code_url: entity.deposit.qrCodeUrl,
        confirmation_method: entity.deposit.confirmationMethod,
        payment_instructions: entity.deposit.paymentInstructions,
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
      recall_interval_days: entity.recallIntervalDays,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString(),
    };
  }

  private _buildResourceSnapshot(entity: ResourceEntity): NonNullable<ResourceEventPayload['data']> {
    let overrides: Record<string, unknown> = {};
    try {
      overrides = JSON.parse(entity.customShiftOverridesJson || '{}');
    } catch {
      overrides = {};
    }
    return {
      resource_type: entity.resourceType,
      name: entity.name,
      title: entity.title,
      category: entity.category,
      description: entity.description,
      is_bookable: entity.isBookable,
      dispatch_status: entity.dispatchStatus,
      custom_shift_overrides: overrides,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString(),
    };
  }

  async createBookingCreatedOutboxEvent(
    entity: BookingEntity,
    session?: ClientSession,
  ): Promise<IOutboxDoc> {
    const version = entity.updatedAt ? entity.updatedAt.getTime() : Date.now();
    const eventId = `evt_bk_${entity.id}_${version}`;
    const payload: BookingEventPayload = {
      event_id: eventId,
      event_type: 'booking.created',
      tenant_id: entity.tenantId,
      agent_id: entity.agentId,
      booking_id: entity.id,
      version,
      timestamp: new Date().toISOString(),
      data: {
        booking_reference: entity.bookingReference,
        service_id: entity.serviceId,
        resource_id: entity.resourceId,
        resource_ids: entity.resourceIds,
        assigned_asset_ids: entity.assignedAssetIds,
        customer_id: entity.customerId,
        customer_name: entity.customerSnapshot.name,
        customer_phone: entity.customerSnapshot.phone,
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
          amount: entity.price.amount,
          currency: entity.price.currency,
        },
        created_at: entity.createdAt.toISOString(),
      },
    };

    return this._outboxRepository.saveEvent(
      {
        eventId,
        aggregateType: 'booking',
        aggregateId: entity.id,
        eventType: 'booking.created',
        topic: KAFKA_SERVICE_TOPIC_BOOKINGS,
        partitionKey: entity.tenantId,
        payload,
      },
      session,
    );
  }

  async emitBookingCreated(entity: BookingEntity): Promise<void> {
    const outboxDoc = await this.createBookingCreatedOutboxEvent(entity);
    await this.publishOutboxEvent(outboxDoc);
  }
}

