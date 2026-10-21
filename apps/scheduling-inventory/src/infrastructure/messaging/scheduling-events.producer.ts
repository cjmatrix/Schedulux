import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import type { DepositInfo, PriceInfo, ServiceVerificationInfo } from '@repo/proto/scheduling';
import { ResourceEntity } from '../../domain/entities/resource.entity.js';
import { ServiceEntity } from '../../domain/entities/service.entity.js';

export const KAFKA_SERVICE_TOPIC_SERVICES = 'scheduling.service.events';
export const KAFKA_SERVICE_TOPIC_RESOURCES = 'scheduling.resource.events';

export type SchedulingEventType =
  | 'service.created'
  | 'service.updated'
  | 'service.deleted'
  | 'resource.created'
  | 'resource.updated'
  | 'resource.deleted';

export interface BaseSchedulingEventPayload {
  event_type: SchedulingEventType;
  tenant_id: string;
  agent_id: string;
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
    allocation_model: string;
    booking_mode: string;
    price: PriceInfo;
    deposit: DepositInfo;
    verification?: ServiceVerificationInfo;
    eligible_resource_ids: string[];
    required_asset_ids: string[];
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

@Injectable()
export class SchedulingEventsProducer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SchedulingEventsProducer.name);

  constructor(
    @Inject('KAFKA_SERVICE')
    private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    try {
      await this.kafkaClient.connect();
      this.logger.log('[Kafka] Successfully connected to Kafka brokers');
    } catch (err) {
      this.logger.error(`[Kafka] Failed to connect to Kafka brokers: ${(err as Error).message}`);
    }
  }

  async onModuleDestroy() {
    try {
      await this.kafkaClient.close();
    } catch {}
  }

  async emitServiceCreated(entity: ServiceEntity): Promise<void> {
    await this.emit<ServiceEventPayload>(KAFKA_SERVICE_TOPIC_SERVICES, {
      event_type: 'service.created',
      tenant_id: entity.tenantId,
      agent_id: entity.agentId,
      service_id: entity.id,
      timestamp: new Date().toISOString(),
      data: this.buildServiceSnapshot(entity),
    });
  }

  async emitServiceUpdated(entity: ServiceEntity): Promise<void> {
    await this.emit<ServiceEventPayload>(KAFKA_SERVICE_TOPIC_SERVICES, {
      event_type: 'service.updated',
      tenant_id: entity.tenantId,
      agent_id: entity.agentId,
      service_id: entity.id,
      timestamp: new Date().toISOString(),
      data: this.buildServiceSnapshot(entity),
    });
  }

  async emitServiceDeleted(tenantId: string, agentId: string, serviceId: string): Promise<void> {
    await this.emit<ServiceEventPayload>(KAFKA_SERVICE_TOPIC_SERVICES, {
      event_type: 'service.deleted',
      tenant_id: tenantId,
      agent_id: agentId,
      service_id: serviceId,
      timestamp: new Date().toISOString(),
    });
  }

  async emitResourceCreated(entity: ResourceEntity): Promise<void> {
    await this.emit<ResourceEventPayload>(KAFKA_SERVICE_TOPIC_RESOURCES, {
      event_type: 'resource.created',
      tenant_id: entity.tenantId,
      agent_id: entity.agentId,
      resource_id: entity.id,
      timestamp: new Date().toISOString(),
      data: this.buildResourceSnapshot(entity),
    });
  }

  async emitResourceUpdated(entity: ResourceEntity): Promise<void> {
    await this.emit<ResourceEventPayload>(KAFKA_SERVICE_TOPIC_RESOURCES, {
      event_type: 'resource.updated',
      tenant_id: entity.tenantId,
      agent_id: entity.agentId,
      resource_id: entity.id,
      timestamp: new Date().toISOString(),
      data: this.buildResourceSnapshot(entity),
    });
  }

  async emitResourceDeleted(tenantId: string, agentId: string, resourceId: string): Promise<void> {
    await this.emit<ResourceEventPayload>(KAFKA_SERVICE_TOPIC_RESOURCES, {
      event_type: 'resource.deleted',
      tenant_id: tenantId,
      agent_id: agentId,
      resource_id: resourceId,
      timestamp: new Date().toISOString(),
    });
  }

  private async emit<T extends BaseSchedulingEventPayload>(
    topic: string,
    payload: T,
  ): Promise<void> {
    try {
      const key = payload.agent_id || payload.tenant_id;
      this.kafkaClient.emit(topic, { key, value: JSON.stringify(payload) });
      this.logger.log(`[Kafka] Emitted to ${topic}: ${payload.event_type}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`[Kafka] Failed to emit to ${topic}: ${msg}`);
    }
  }

  private buildServiceSnapshot(entity: ServiceEntity): NonNullable<ServiceEventPayload['data']> {
    return {
      name: entity.name,
      category: entity.category,
      description: entity.description,
      duration_minutes: entity.durationMinutes,
      buffer_minutes: entity.bufferMinutes,
      allocation_model: entity.allocationModel,
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
      eligible_resource_ids: entity.eligibleResourceIds,
      required_asset_ids: entity.requiredAssetIds,
      recall_interval_days: entity.recallIntervalDays,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString(),
    };
  }

  private buildResourceSnapshot(entity: ResourceEntity): NonNullable<ResourceEventPayload['data']> {
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
}
