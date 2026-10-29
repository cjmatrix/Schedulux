import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ListResourcesRequest } from '@repo/proto/scheduling';
import { IResourceRepository } from '../../../domain/repositories/resource.repository.interface.js';
import { RESOURCE_REPOSITORY } from '../../../domain/tokens.js';
import {
  IListResourcesUseCase,
  ListResourcesOutput,
} from '../../interfaces/resource-use-cases.interface.js';

@Injectable()
export class ListResourcesUseCase implements IListResourcesUseCase {
  constructor(
    @Inject(RESOURCE_REPOSITORY)
    private readonly _resourceRepository: IResourceRepository,
  ) {}

  async execute(dto: ListResourcesRequest): Promise<ListResourcesOutput> {
    if (!dto.agent_id?.trim()) throw new BadRequestException('agent_id is required');

    const page = dto.page > 0 ? dto.page : 1;
    const limit = dto.limit > 0 ? dto.limit : 20;

    const { resources, total, summary } = await this._resourceRepository.findAll(dto.tenant_id, {
      page,
      limit,
      resourceType: dto.resource_type || undefined,
      dispatchStatus: dto.dispatch_status || undefined,
      category: dto.category || undefined,
      agentId: dto.agent_id.trim(),
      search: dto.search || undefined,
    });

    return { resources, total, page, limit, summary };
  }
}
