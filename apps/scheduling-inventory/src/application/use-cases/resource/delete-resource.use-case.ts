import { Inject, Injectable, NotFoundException } from '@nestjs/common';
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
  constructor(
    @Inject(RESOURCE_REPOSITORY)
    private readonly resourceRepository: IResourceRepository,
    @Inject(SCHEDULING_EVENTS_PRODUCER)
    private readonly eventsProducer: ISchedulingEventsProducer,
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(dto: DeleteResourceRequest): Promise<boolean> {
    const existing = await this.resourceRepository.findById(dto.tenant_id, dto.resource_id);
    if (!existing) {
      throw new NotFoundException(
        `Resource ${dto.resource_id} not found for tenant ${dto.tenant_id}`,
      );
    }

    const { outbox } = await this.unitOfWork.withTransaction(async () => {
      const deleted = await this.resourceRepository.delete(dto.tenant_id, dto.resource_id);
      if (!deleted) {
        throw new NotFoundException(
          `Resource ${dto.resource_id} not found for tenant ${dto.tenant_id}`,
        );
      }
      const outboxDoc = await this.eventsProducer.createResourceDeletedOutboxEvent(
        existing.tenantId,
        existing.agentId,
        existing.id,
      );
      return { outbox: outboxDoc };
    });

    await this.eventsProducer.publishOutboxEvent(outbox);

    return true;
  }
}
