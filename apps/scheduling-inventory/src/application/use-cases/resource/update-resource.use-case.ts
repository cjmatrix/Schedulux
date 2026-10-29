import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateResourceRequest } from '@repo/proto/scheduling';
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
import { IUpdateResourceUseCase } from '../../interfaces/resource-use-cases.interface.js';
import type { ISchedulingEventsProducer } from '../../interfaces/scheduling-events-producer.interface.js';

@Injectable()
export class UpdateResourceUseCase implements IUpdateResourceUseCase {
  constructor(
    @Inject(RESOURCE_REPOSITORY)
    private readonly _resourceRepository: IResourceRepository,
    @Inject(SCHEDULING_EVENTS_PRODUCER)
    private readonly _eventsProducer: ISchedulingEventsProducer,
    @Inject(UNIT_OF_WORK)
    private readonly _unitOfWork: IUnitOfWork,
  ) {}

  async execute(dto: UpdateResourceRequest): Promise<ResourceEntity> {
    const existing = await this._resourceRepository.findById(dto.tenant_id, dto.resource_id);
    if (!existing) {
      throw new NotFoundException(
        `Resource ${dto.resource_id} not found for tenant ${dto.tenant_id}`,
      );
    }

    existing.updateDetails({
      resourceType: dto.resource_type as ResourceType | undefined,
      name: dto.name,
      title: dto.title,
      category: dto.category,
      description: dto.description,
      isBookable: dto.is_bookable,
      dispatchStatus: dto.dispatch_status as DispatchStatus | undefined,
      customShiftOverridesJson: dto.custom_shift_overrides_json,
    });

    const { updated, outbox } = await this._unitOfWork.withTransaction(async () => {
      const updatedEntity = await this._resourceRepository.update(existing);
      if (!updatedEntity) {
        throw new NotFoundException(`Failed to update resource ${dto.resource_id}`);
      }
      const outboxDoc = await this._eventsProducer.createResourceUpdatedOutboxEvent(updatedEntity);
      return { updated: updatedEntity, outbox: outboxDoc };
    });

    await this._eventsProducer.publishOutboxEvent(outbox);

    return updated;
  }
}
