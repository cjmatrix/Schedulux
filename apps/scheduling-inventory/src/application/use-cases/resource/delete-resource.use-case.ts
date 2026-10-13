import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RESOURCE_REPOSITORY } from '../../../domain/tokens.js';
import { IResourceRepository } from '../../../domain/repositories/resource.repository.interface.js';
import { IDeleteResourceUseCase } from '../../interfaces/resource-use-cases.interface.js';
import { DeleteResourceRequest } from '@repo/proto/scheduling';

@Injectable()
export class DeleteResourceUseCase implements IDeleteResourceUseCase {
  constructor(
    @Inject(RESOURCE_REPOSITORY)
    private readonly resourceRepository: IResourceRepository,
  ) {}

  async execute(dto: DeleteResourceRequest): Promise<boolean> {
    const deleted = await this.resourceRepository.delete(dto.tenant_id, dto.resource_id);
    if (!deleted) {
      throw new NotFoundException(`Resource ${dto.resource_id} not found for tenant ${dto.tenant_id}`);
    }
    return true;
  }
}
