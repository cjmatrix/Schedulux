import { Inject, Injectable } from '@nestjs/common';
import { SERVICE_REPOSITORY } from '../../../domain/tokens.js';
import { IServiceRepository } from '../../../domain/repositories/service.repository.interface.js';
import { ServiceEntity } from '../../../domain/entities/service.entity.js';
import { IListServicesUseCase, ListServicesOutput } from '../../interfaces/service-use-cases.interface.js';
import { ListServicesRequest } from '@repo/proto/scheduling';

@Injectable()
export class ListServicesUseCase implements IListServicesUseCase {
  constructor(
    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: IServiceRepository,
  ) {}

  async execute(dto: ListServicesRequest): Promise<ListServicesOutput> {
    const page = dto.page > 0 ? dto.page : 1;
    const limit = dto.limit > 0 ? dto.limit : 20;

    const { services, total } = await this.serviceRepository.findAll(dto.tenant_id, {
      page,
      limit,
      category: dto.category || undefined,
      agentId: dto.agent_id || undefined,
    });

    return { services, total, page, limit };
  }
}
