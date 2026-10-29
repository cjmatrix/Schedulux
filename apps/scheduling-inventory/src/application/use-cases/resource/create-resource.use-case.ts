import { Inject, Injectable } from '@nestjs/common';
import { CreateResourceRequest } from '@repo/proto/scheduling';
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
import { ICreateResourceUseCase } from '../../interfaces/resource-use-cases.interface.js';
import type { ISchedulingEventsProducer } from '../../interfaces/scheduling-events-producer.interface.js';

@Injectable()
export class CreateResourceUseCase implements ICreateResourceUseCase {
  constructor(
    @Inject(RESOURCE_REPOSITORY)
    private readonly _resourceRepository: IResourceRepository,
    @Inject(SCHEDULING_EVENTS_PRODUCER)
    private readonly _eventsProducer: ISchedulingEventsProducer,
    @Inject(UNIT_OF_WORK)
    private readonly _unitOfWork: IUnitOfWork,
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

    const { created, outbox } = await this._unitOfWork.withTransaction(async () => {
      const createdEntity = await this._resourceRepository.create(resource);
      const outboxDoc = await this._eventsProducer.createResourceCreatedOutboxEvent(createdEntity);
      return { created: createdEntity, outbox: outboxDoc };
    });

    await this._eventsProducer.publishOutboxEvent(outbox);

    return created;
  }
}
