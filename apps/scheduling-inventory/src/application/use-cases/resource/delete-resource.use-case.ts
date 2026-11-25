import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DeleteResourceRequest } from '@repo/proto/scheduling';
import { IResourceRepository } from '../../../domain/repositories/resource.repository.interface.js';
import type { IUnitOfWork } from '../../../domain/repositories/unit-of-work.interface.js';
import {
  RESOURCE_REPOSITORY,
  SCHEDULING_EVENTS_PRODUCER,
  UNIT_OF_WORK,
} from '../../../domain/tokens.js';
import { IDeleteResourceUseCase } from '../../interfaces/resource-use-cases.interface.js';
import type { ISchedulingEventsProducer } from '../../interfaces/scheduling-events-producer.interface.js';

@Injectable()
export class DeleteResourceUseCase implements IDeleteResourceUseCase {
  private readonly _logger = new Logger(DeleteResourceUseCase.name);

  constructor(
    @Inject(RESOURCE_REPOSITORY)
    private readonly _resourceRepository: IResourceRepository,
    @Inject(SCHEDULING_EVENTS_PRODUCER)
    private readonly _eventsProducer: ISchedulingEventsProducer,
    @Inject(UNIT_OF_WORK)
    private readonly _unitOfWork: IUnitOfWork,
  ) {}

  async execute(dto: DeleteResourceRequest): Promise<boolean> {
    const existing = await this._resourceRepository.findById(dto.tenant_id, dto.resource_id);
    if (!existing) {
      throw new NotFoundException(
        `Resource ${dto.resource_id} not found for tenant ${dto.tenant_id}`,
      );
    }

    const { outbox } = await this._unitOfWork.withTransaction(async () => {
      const deleted = await this._resourceRepository.delete(dto.tenant_id, dto.resource_id);
      if (!deleted) {
        throw new NotFoundException(
          `Resource ${dto.resource_id} not found for tenant ${dto.tenant_id}`,
        );
      }
      const outboxDoc = await this._eventsProducer.createResourceDeletedOutboxEvent(
        existing.tenantId,
        existing.agentId,
        existing.id,
      );
      return { outbox: outboxDoc };
    });

    void this._eventsProducer.publishOutboxEvent(outbox).catch((err: unknown) => {
      this._logger.warn(
        `Immediate outbox dispatch failed for resource ${dto.resource_id}: ${err}. Recovery sweeper will retry.`,
      );
    });

    return true;
  }
}
