import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DeleteServiceRequest } from '@repo/proto/scheduling';
import { IServiceRepository } from '../../../domain/repositories/service.repository.interface.js';
import type { IUnitOfWork } from '../../../domain/repositories/unit-of-work.interface.js';
import {
  SCHEDULING_EVENTS_PRODUCER,
  SERVICE_REPOSITORY,
  UNIT_OF_WORK,
} from '../../../domain/tokens.js';
import type { ISchedulingEventsProducer } from '../../interfaces/scheduling-events-producer.interface.js';
import { IDeleteServiceUseCase } from '../../interfaces/service-use-cases.interface.js';

@Injectable()
export class DeleteServiceUseCase implements IDeleteServiceUseCase {
  constructor(
    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: IServiceRepository,
    @Inject(SCHEDULING_EVENTS_PRODUCER)
    private readonly eventsProducer: ISchedulingEventsProducer,
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(dto: DeleteServiceRequest): Promise<boolean> {
    const existing = await this.serviceRepository.findById(dto.tenant_id, dto.service_id);
    if (!existing) {
      throw new NotFoundException(
        `Service ${dto.service_id} not found for tenant ${dto.tenant_id}`,
      );
    }

    const { outbox } = await this.unitOfWork.withTransaction(async () => {
      const deleted = await this.serviceRepository.delete(dto.tenant_id, dto.service_id);
      if (!deleted) {
        throw new NotFoundException(
          `Service ${dto.service_id} not found for tenant ${dto.tenant_id}`,
        );
      }
      const outboxDoc = await this.eventsProducer.createServiceDeletedOutboxEvent(
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
