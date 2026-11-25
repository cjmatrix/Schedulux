import * as grpc from '@grpc/grpc-js';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { CreateServiceRequest } from '@repo/proto/scheduling';
import { getTierConfig, resolveTierConfigWithCache } from '../../../domain/constants/tiers.constant.js';
import { ServiceEntity } from '../../../domain/entities/service.entity.js';
import { IServiceRepository } from '../../../domain/repositories/service.repository.interface.js';
import type { IUnitOfWork } from '../../../domain/repositories/unit-of-work.interface.js';
import {
  SCHEDULING_EVENTS_PRODUCER,
  SERVICE_REPOSITORY,
  UNIT_OF_WORK,
} from '../../../domain/tokens.js';
import { generateSemanticId } from '../../../domain/utils/id-generator.js';
import { PriceVO } from '../../../domain/value-objects/price.vo.js';
import type { ICacheRepository } from '../../../infrastructure/cache/cache-repository.interface.js';
import { CACHE_REPOSITORY } from '../../../infrastructure/cache/redis.module.js';
import type { ISchedulingEventsProducer } from '../../interfaces/scheduling-events-producer.interface.js';
import { ICreateServiceUseCase } from '../../interfaces/service-use-cases.interface.js';

@Injectable()
export class CreateServiceUseCase implements ICreateServiceUseCase {
  private readonly _logger = new Logger(CreateServiceUseCase.name);

  constructor(
    @Inject(SERVICE_REPOSITORY)
    private readonly _serviceRepository: IServiceRepository,
    @Inject(SCHEDULING_EVENTS_PRODUCER)
    private readonly _eventsProducer: ISchedulingEventsProducer,
    @Inject(UNIT_OF_WORK)
    private readonly _unitOfWork: IUnitOfWork,
    @Inject(CACHE_REPOSITORY)
    private readonly _cacheRepo: ICacheRepository,
  ) {}

  async execute(dto: CreateServiceRequest, propagatedTier?: string): Promise<ServiceEntity> {
    const tier =
      propagatedTier || (await this._cacheRepo.get(`tenant:${dto.tenant_id}:tier`)) || 'starter';
    const tierConfig = await resolveTierConfigWithCache(this._cacheRepo, tier);

    if (tierConfig.max_services !== -1) {
      const currentCount = await this._serviceRepository.countByTenant(dto.tenant_id);
      if (currentCount >= tierConfig.max_services) {
        throw new RpcException({
          code: grpc.status.RESOURCE_EXHAUSTED,
          message: `Service limit reached (${tierConfig.max_services} services) for your tier (${tierConfig.name}). This workspace currently has ${currentCount} services. Please upgrade your tier.`,
        });
      }
    }

    const serviceId = generateSemanticId('srv', dto.name);

    const price = PriceVO.create(dto.price?.type, dto.price?.amount, dto.price?.currency);

    const service = new ServiceEntity({
      id: serviceId,
      tenantId: dto.tenant_id,
      agentId: dto.agent_id || '',
      name: dto.name,
      category: dto.category || 'General',
      description: dto.description || '',
      durationMinutes: dto.duration_minutes || 30,
      bufferMinutes: dto.buffer_minutes || 0,
      bookingMode: dto.booking_mode || 'time_slot',
      price,
      verification: dto.verification ? { require_otp: dto.verification.require_otp } : undefined,
      resourceRequirements: (dto.resource_requirements ?? []).map((r) => ({
        role: r.role || 'Staff',
        resourceType: r.resource_type || 'staff',
        count: r.count || 1,
        eligibleResourceIds: r.eligible_resource_ids ?? [],
        selectionMode:
          (r.selection_mode as 'user_selectable' | 'auto_assign') ||
          (r.resource_type === 'staff' ? 'user_selectable' : 'auto_assign'),
      })),
    });

    const { created, outbox } = await this._unitOfWork.withTransaction(async () => {
      const createdEntity = await this._serviceRepository.create(service);
      const outboxDoc = await this._eventsProducer.createServiceCreatedOutboxEvent(createdEntity);
      return { created: createdEntity, outbox: outboxDoc };
    });

    void this._eventsProducer.publishOutboxEvent(outbox).catch((err: unknown) => {
      this._logger.warn(
        `Immediate outbox dispatch failed for service ${serviceId}: ${err}. Recovery sweeper will retry.`,
      );
    });

    return created;
  }
}
