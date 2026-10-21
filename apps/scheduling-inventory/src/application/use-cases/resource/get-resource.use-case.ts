import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { GetResourceRequest } from '@repo/proto/scheduling';
import { ResourceEntity } from '../../../domain/entities/resource.entity.js';
import { IResourceRepository } from '../../../domain/repositories/resource.repository.interface.js';
import { RESOURCE_REPOSITORY } from '../../../domain/tokens.js';
import { IGetResourceUseCase } from '../../interfaces/resource-use-cases.interface.js';

@Injectable()
export class GetResourceUseCase implements IGetResourceUseCase {
  constructor(
    @Inject(RESOURCE_REPOSITORY)
    private readonly resourceRepository: IResourceRepository,
  ) {}

  async execute(dto: GetResourceRequest): Promise<ResourceEntity> {
    const resource = await this.resourceRepository.findById(dto.tenant_id, dto.resource_id);
    if (!resource) {
      throw new NotFoundException(
        `Resource ${dto.resource_id} not found for tenant ${dto.tenant_id}`,
      );
    }
    return resource;
  }
}
