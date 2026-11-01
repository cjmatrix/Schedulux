import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DeleteServiceRequest } from '@repo/proto/scheduling';
import { IServiceRepository } from '../../../domain/repositories/service.repository.interface.js';
import type { IUnitOfWork } from '../../../domain/repositories/unit-of-work.interface.js';
import {
  CACHE_REPOSITORY,
  SCHEDULING_EVENTS_PRODUCER,
  SERVICE_REPOSITORY,
  UNIT_OF_WORK,
} from '../../../domain/tokens.js';
import type { ICacheRepository } from '../../../infrastructure/cache/cache-repository.interface.js';
import type { ISchedulingEventsProducer } from '../../interfaces/scheduling-events-producer.interface.js';
import { IDeleteServiceUseCase } from '../../interfaces/service-use-cases.interface.js';
import { invalidateCachedService } from '../../utils/service-cache.helper.js';

@Injectable()
export class DeleteServiceUseCase implements IDeleteServiceUseCase {
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

  async execute(dto: DeleteServiceRequest): Promise<boolean> {
    const existing = await this._serviceRepository.findById(dto.tenant_id, dto.service_id);
    if (!existing) {
      throw new NotFoundException(
        `Service ${dto.service_id} not found for tenant ${dto.tenant_id}`,
      );
    }

    const { outbox } = await this._unitOfWork.withTransaction(async () => {
      const deleted = await this._serviceRepository.delete(dto.tenant_id, dto.service_id);
      if (!deleted) {
        throw new NotFoundException(
          `Service ${dto.service_id} not found for tenant ${dto.tenant_id}`,
        );
      }
      const outboxDoc = await this._eventsProducer.createServiceDeletedOutboxEvent(
        existing.tenantId,
        existing.agentId,
        existing.id,
      );
      return { outbox: outboxDoc };
    });

    await this._eventsProducer.publishOutboxEvent(outbox);

    invalidateCachedService(this._cacheRepo, dto.tenant_id, dto.service_id);

    return true;
  }
}
