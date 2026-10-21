import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DeleteServiceRequest } from '@repo/proto/scheduling';
import { IServiceRepository } from '../../../domain/repositories/service.repository.interface.js';
import { SERVICE_REPOSITORY } from '../../../domain/tokens.js';
import { SchedulingEventsProducer } from '../../../infrastructure/messaging/scheduling-events.producer.js';
import { IDeleteServiceUseCase } from '../../interfaces/service-use-cases.interface.js';

@Injectable()
export class DeleteServiceUseCase implements IDeleteServiceUseCase {
  constructor(
    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: IServiceRepository,
    private readonly eventsProducer: SchedulingEventsProducer,
  ) {}

  async execute(dto: DeleteServiceRequest): Promise<boolean> {
    const existing = await this.serviceRepository.findById(dto.tenant_id, dto.service_id);
    if (!existing) {
      throw new NotFoundException(
        `Service ${dto.service_id} not found for tenant ${dto.tenant_id}`,
      );
    }

    const deleted = await this.serviceRepository.delete(dto.tenant_id, dto.service_id);
    if (!deleted) {
      throw new NotFoundException(
        `Service ${dto.service_id} not found for tenant ${dto.tenant_id}`,
      );
    }

    await this.eventsProducer.emitServiceDeleted(existing.tenantId, existing.agentId, existing.id);

    return true;
  }
}
