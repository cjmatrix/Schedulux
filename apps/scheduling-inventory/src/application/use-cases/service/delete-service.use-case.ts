import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SERVICE_REPOSITORY } from '../../../domain/tokens.js';
import { IServiceRepository } from '../../../domain/repositories/service.repository.interface.js';
import { IDeleteServiceUseCase } from '../../interfaces/service-use-cases.interface.js';
import { DeleteServiceRequest } from '@repo/proto/scheduling';

@Injectable()
export class DeleteServiceUseCase implements IDeleteServiceUseCase {
  constructor(
    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: IServiceRepository,
  ) {}

  async execute(dto: DeleteServiceRequest): Promise<boolean> {
    const deleted = await this.serviceRepository.delete(dto.tenant_id, dto.service_id);
    if (!deleted) {
      throw new NotFoundException(`Service ${dto.service_id} not found for tenant ${dto.tenant_id}`);
    }
    return true;
  }
}
