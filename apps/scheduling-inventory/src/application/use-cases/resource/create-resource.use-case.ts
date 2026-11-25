import * as grpc from '@grpc/grpc-js';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { CreateResourceRequest } from '@repo/proto/scheduling';
import { getTierConfig, resolveTierConfigWithCache } from '../../../domain/constants/tiers.constant.js';
import {
  DispatchStatus,
  ResourceEntity,
  ResourceType,
} from '../../../domain/entities/resource.entity.js';
import { IResourceRepository } from '../../../domain/repositories/resource.repository.interface.js';
import type { IUnitOfWork } from '../../../domain/repositories/unit-of-work.interface.js';
import {
  RESOURCE_REPOSITORY,
  SCHEDULING_EVENTS_PRODUCER,
  UNIT_OF_WORK,
} from '../../../domain/tokens.js';
import { generateSemanticId } from '../../../domain/utils/id-generator.js';
import type { ICacheRepository } from '../../../infrastructure/cache/cache-repository.interface.js';
import { CACHE_REPOSITORY } from '../../../infrastructure/cache/redis.module.js';
import { ICreateResourceUseCase } from '../../interfaces/resource-use-cases.interface.js';
import type { ISchedulingEventsProducer } from '../../interfaces/scheduling-events-producer.interface.js';

@Injectable()
export class CreateResourceUseCase implements ICreateResourceUseCase {
  private readonly _logger = new Logger(CreateResourceUseCase.name);

  constructor(
    @Inject(RESOURCE_REPOSITORY)
    private readonly _resourceRepository: IResourceRepository,
    @Inject(SCHEDULING_EVENTS_PRODUCER)
    private readonly _eventsProducer: ISchedulingEventsProducer,
    @Inject(UNIT_OF_WORK)
    private readonly _unitOfWork: IUnitOfWork,
    @Inject(CACHE_REPOSITORY)
    private readonly _cacheRepo: ICacheRepository,
  ) {}

  async execute(dto: CreateResourceRequest, propagatedTier?: string): Promise<ResourceEntity> {
    const tier =
      propagatedTier || (await this._cacheRepo.get(`tenant:${dto.tenant_id}:tier`)) || 'starter';
    const tierConfig = await resolveTierConfigWithCache(this._cacheRepo, tier);

    if (tierConfig.max_resources !== -1) {
      const currentCount = await this._resourceRepository.countByTenant(dto.tenant_id);
      if (currentCount >= tierConfig.max_resources) {
        throw new RpcException({
          code: grpc.status.RESOURCE_EXHAUSTED,
          message: `Resource limit reached (${tierConfig.max_resources} resources) for your tier (${tierConfig.name}). This workspace currently has ${currentCount} resources. Please upgrade your tier.`,
        });
      }
    }

    const resourceId = generateSemanticId('res', dto.name);

    const resource = new ResourceEntity({
      id: resourceId,
      tenantId: dto.tenant_id,
      agentId: dto.agent_id || '',
      resourceType: (dto.resource_type as ResourceType) || 'staff',
      name: dto.name,
      title: dto.title || '',
      category: dto.category || 'General',
      description: dto.description || '',
      isBookable: dto.is_bookable !== undefined ? dto.is_bookable : true,
      dispatchStatus: (dto.dispatch_status as DispatchStatus) || 'active',
      customShiftOverridesJson: dto.custom_shift_overrides_json || '{}',
    });

    const { created, outbox } = await this._unitOfWork.withTransaction(async () => {
      const createdEntity = await this._resourceRepository.create(resource);
      const outboxDoc = await this._eventsProducer.createResourceCreatedOutboxEvent(createdEntity);
      return { created: createdEntity, outbox: outboxDoc };
    });

    void this._eventsProducer.publishOutboxEvent(outbox).catch((err: unknown) => {
      this._logger.warn(
        `Immediate outbox dispatch failed for resource ${resourceId}: ${err}. Recovery sweeper will retry.`,
      );
    });

    return created;
  }
}
