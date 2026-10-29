import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ListServicesRequest } from '@repo/proto/scheduling';
import { IServiceRepository } from '../../../domain/repositories/service.repository.interface.js';
import { SERVICE_REPOSITORY } from '../../../domain/tokens.js';
import {
  IListServicesUseCase,
  ListServicesOutput,
} from '../../interfaces/service-use-cases.interface.js';

@Injectable()
export class ListServicesUseCase implements IListServicesUseCase {
  constructor(
    @Inject(SERVICE_REPOSITORY)
    private readonly _serviceRepository: IServiceRepository,
  ) {}

  async execute(dto: ListServicesRequest): Promise<ListServicesOutput> {
    if (!dto.agent_id?.trim()) throw new BadRequestException('agent_id is required');

    const page = dto.page > 0 ? dto.page : 1;
    const limit = dto.limit > 0 ? dto.limit : 20;

    const { services, total, summary } = await this._serviceRepository.findAll(dto.tenant_id, {
      page,
      limit,
      category: dto.category || undefined,
      agentId: dto.agent_id.trim(),
      search: dto.search || undefined,
    });

    return { services, total, page, limit, summary };
  }
}
