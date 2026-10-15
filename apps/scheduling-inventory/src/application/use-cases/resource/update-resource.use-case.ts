import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RESOURCE_REPOSITORY } from '../../../domain/tokens.js';
import { IResourceRepository } from '../../../domain/repositories/resource.repository.interface.js';
import { ResourceEntity, ResourceType, DispatchStatus } from '../../../domain/entities/resource.entity.js';
import { IUpdateResourceUseCase } from '../../interfaces/resource-use-cases.interface.js';
import { SchedulingEventsProducer } from '../../../infrastructure/messaging/scheduling-events.producer.js';
import { UpdateResourceRequest } from '@repo/proto/scheduling';

@Injectable()
export class UpdateResourceUseCase implements IUpdateResourceUseCase {
  constructor(
    @Inject(RESOURCE_REPOSITORY)
    private readonly resourceRepository: IResourceRepository,
    private readonly eventsProducer: SchedulingEventsProducer,
  ) {}

  async execute(dto: UpdateResourceRequest): Promise<ResourceEntity> {
    const existing = await this.resourceRepository.findById(dto.tenant_id, dto.resource_id);
    if (!existing) {
      throw new NotFoundException(`Resource ${dto.resource_id} not found for tenant ${dto.tenant_id}`);
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

    const updated = await this.resourceRepository.update(existing);
    if (!updated) {
      throw new NotFoundException(`Failed to update resource ${dto.resource_id}`);
    }

    // CQRS: fire-and-forget event for AI-orchestration consumer
    await this.eventsProducer.emitResourceUpdated(updated);

    return updated;
  }
}
