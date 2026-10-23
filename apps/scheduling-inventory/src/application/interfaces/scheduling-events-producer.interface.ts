import type { ClientSession } from 'mongoose';
import type { ResourceEntity } from '../../domain/entities/resource.entity.js';
import type { ServiceEntity } from '../../domain/entities/service.entity.js';
import type { IOutboxDoc } from '../../infrastructure/database/schemas/outbox.schema.js';

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

  publishOutboxEvent(outboxDoc: IOutboxDoc): Promise<void>;

  emitServiceCreated(entity: ServiceEntity): Promise<void>;
  emitServiceUpdated(entity: ServiceEntity): Promise<void>;
  emitServiceDeleted(tenantId: string, agentId: string, serviceId: string): Promise<void>;

  emitResourceCreated(entity: ResourceEntity): Promise<void>;
  emitResourceUpdated(entity: ResourceEntity): Promise<void>;
  emitResourceDeleted(tenantId: string, agentId: string, resourceId: string): Promise<void>;
}
