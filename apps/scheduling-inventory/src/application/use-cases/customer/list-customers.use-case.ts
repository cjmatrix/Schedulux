import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { ListCustomersRequest, ListCustomersResponse } from '@repo/proto/scheduling';
import type { ICustomerRepository } from '../../../domain/repositories/customer.repository.interface.js';
import { CUSTOMER_REPOSITORY } from '../../../domain/tokens.js';
import type { IListCustomersUseCase } from '../../interfaces/booking-use-cases.interface.js';

@Injectable()
export class ListCustomersUseCase implements IListCustomersUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly _customerRepo: ICustomerRepository,
  ) {}

  async execute(dto: ListCustomersRequest): Promise<ListCustomersResponse> {
    const tenantId = dto.tenant_id?.trim();
    if (!tenantId) {
      throw new BadRequestException('tenant_id is required to list customers');
    }

    const page = Math.max(1, dto.page || 1);
    const limit = Math.min(Math.max(1, dto.limit || 10), 100);

    const { customers, total } = await this._customerRepo.findAll(tenantId, {
      page,
      limit,
      search: dto.search?.trim() || undefined,
      agentId: dto.agent_id?.trim() || undefined,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      customers: customers.map((c) => ({
        id: c.id,
        tenant_id: c.tenantId,
        agent_id: c.agentId,
        name: c.name,
        phone: c.phone,
        email: c.email,
        notes: c.notes,
        is_guest: c.isGuest,
        total_bookings: c.totalBookings,
        created_at: c.createdAt.toISOString(),
        updated_at: c.updatedAt.toISOString(),
      })),
      total,
      page,
      limit,
      total_pages: totalPages,
    };
  }
}

