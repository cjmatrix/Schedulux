import { Inject, Injectable } from '@nestjs/common';
import { RESOURCE_REPOSITORY } from '../../../domain/tokens.js';
import { IResourceRepository } from '../../../domain/repositories/resource.repository.interface.js';
import { ResourceEntity } from '../../../domain/entities/resource.entity.js';
import { IListResourcesUseCase, ListResourcesOutput } from '../../interfaces/resource-use-cases.interface.js';
import { ListResourcesRequest } from '@repo/proto/scheduling';

@Injectable()
export class ListResourcesUseCase implements IListResourcesUseCase {
  constructor(
    @Inject(RESOURCE_REPOSITORY)
    private readonly resourceRepository: IResourceRepository,
  ) {}

  async execute(dto: ListResourcesRequest): Promise<ListResourcesOutput> {
    const page = dto.page > 0 ? dto.page : 1;
    const limit = dto.limit > 0 ? dto.limit : 20;

    const { resources, total } = await this.resourceRepository.findAll(dto.tenant_id, {
      page,
      limit,
      resourceType: dto.resource_type || undefined,
      dispatchStatus: dto.dispatch_status || undefined,
    });

    return { resources, total, page, limit };
  }
}
