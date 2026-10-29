import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { GetServiceRequest } from '@repo/proto/scheduling';
import { ServiceEntity } from '../../../domain/entities/service.entity.js';
import { IServiceRepository } from '../../../domain/repositories/service.repository.interface.js';
import { SERVICE_REPOSITORY } from '../../../domain/tokens.js';
import { IGetServiceUseCase } from '../../interfaces/service-use-cases.interface.js';

@Injectable()
export class GetServiceUseCase implements IGetServiceUseCase {
  constructor(
    @Inject(SERVICE_REPOSITORY)
    private readonly _serviceRepository: IServiceRepository,
  ) {}

  async execute(dto: GetServiceRequest): Promise<ServiceEntity> {
    const service = await this._serviceRepository.findById(dto.tenant_id, dto.service_id);
    if (!service) {
      throw new NotFoundException(
        `Service ${dto.service_id} not found for tenant ${dto.tenant_id}`,
      );
    }
    return service;
  }
}
