/**
 * SchedulingEventsProducer
 *
 * CQRS Kafka producer for scheduling-inventory service.
 * Topics:
 *   - scheduling.service.events  → service.created / service.updated / service.deleted
 *   - scheduling.resource.events → resource.created / resource.updated / resource.deleted
 *
 * The consumer in AI-orchestration will upsert / remove items from
 * the AgentRuntimeConfig.services[] and AgentRuntimeConfig.resources[] arrays.
 */

import { Injectable, Inject, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { ServiceEntity } from '../../domain/entities/service.entity.js';
import { ResourceEntity } from '../../domain/entities/resource.entity.js';

export const KAFKA_SERVICE_TOPIC_SERVICES  = 'scheduling.service.events';
export const KAFKA_SERVICE_TOPIC_RESOURCES = 'scheduling.resource.events';

export type SchedulingEventType =
  | 'service.created'
  | 'service.updated'
  | 'service.deleted'
  | 'resource.created'
  | 'resource.updated'
  | 'resource.deleted';

export interface ServiceEventPayload {
  event_type: SchedulingEventType;
  tenant_id: string;
  agent_id: string;
  service_id: string;
  timestamp: string;
 
  data?: {
    name: string;
    category: string;
    description: string;
    duration_minutes: number;
    buffer_minutes: number;
    allocation_model: string;
    booking_mode: string;
    price: { type: string; amount: number; currency: string };
    deposit: {
      required: boolean;
      amount: number;
      processor: string;
      upi_id: string;
      qr_code_url: string;
      confirmation_method: string;
      payment_instructions: string;
    };
    eligible_resource_ids: string[];
    required_asset_ids: string[];
    recall_interval_days: number;
    created_at: string;
    updated_at: string;
  };
}

export interface ResourceEventPayload {
  event_type: SchedulingEventType;
  tenant_id: string;
  agent_id: string;
  resource_id: string;
  timestamp: string;

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
    } catch {
    }
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



  private async emit<T>(topic: string, payload: T): Promise<void> {
    try {
      
      const key = (payload as any).agent_id || (payload as any).tenant_id;
      this.kafkaClient.emit(topic, { key, value: JSON.stringify(payload) });
      this.logger.log(`[Kafka] Emitted to ${topic}: ${(payload as any).event_type}`);
    } catch (err) {
      this.logger.error(`[Kafka] Failed to emit to ${topic}: ${(err as Error).message}`);
     
    }
  }

  private buildServiceSnapshot(entity: ServiceEntity) {
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
      eligible_resource_ids: entity.eligibleResourceIds,
      required_asset_ids: entity.requiredAssetIds,
      recall_interval_days: entity.recallIntervalDays,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString(),
    };
  }

  private buildResourceSnapshot(entity: ResourceEntity) {
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
