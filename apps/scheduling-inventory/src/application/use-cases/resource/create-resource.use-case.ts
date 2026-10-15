import { Inject, Injectable } from '@nestjs/common';
import { RESOURCE_REPOSITORY } from '../../../domain/tokens.js';
import { IResourceRepository } from '../../../domain/repositories/resource.repository.interface.js';
import { ResourceEntity, ResourceType, DispatchStatus } from '../../../domain/entities/resource.entity.js';
import { generateSemanticId } from '../../../domain/utils/id-generator.js';
import { ICreateResourceUseCase } from '../../interfaces/resource-use-cases.interface.js';
import { SchedulingEventsProducer } from '../../../infrastructure/messaging/scheduling-events.producer.js';
import { CreateResourceRequest } from '@repo/proto/scheduling';

@Injectable()
export class CreateResourceUseCase implements ICreateResourceUseCase {
  constructor(
    @Inject(RESOURCE_REPOSITORY)
    private readonly resourceRepository: IResourceRepository,
    private readonly eventsProducer: SchedulingEventsProducer,
  ) {}

  async execute(dto: CreateResourceRequest): Promise<ResourceEntity> {
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

    const created = await this.resourceRepository.create(resource);

    await this.eventsProducer.emitResourceCreated(created);

    return created;
  }
}
