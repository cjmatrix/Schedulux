import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import type { ListBookingsRequest } from '@repo/proto/scheduling';
import { BookingEntity } from '../../../domain/entities/booking.entity.js';
import type { IBookingRepository } from '../../../domain/repositories/booking.repository.interface.js';
import { BOOKING_REPOSITORY } from '../../../domain/tokens.js';
import type { IListBookingsUseCase } from '../../interfaces/booking-use-cases.interface.js';

@Injectable()
export class ListBookingsUseCase implements IListBookingsUseCase {
  private readonly _logger = new Logger(ListBookingsUseCase.name);

  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly _bookingRepository: IBookingRepository,
  ) {}

  async execute(dto: ListBookingsRequest): Promise<{
    bookings: BookingEntity[];
    total: number;
    page: number;
    limit: number;
  }> {
    if (!dto.tenant_id?.trim()) {
      throw new BadRequestException('tenant_id is required');
    }

    const tenantId = dto.tenant_id.trim();

    const page = Math.max(1, dto.page || 1);
    const limit = Math.min(100, Math.max(1, dto.limit || 20));

    let startDate: Date | undefined;
    if (dto.start_date) {
      const parsed = new Date(dto.start_date);
      if (!Number.isNaN(parsed.getTime())) startDate = parsed;
    }

    let endDate: Date | undefined;
    if (dto.end_date) {
      const parsed = new Date(dto.end_date);
      if (!Number.isNaN(parsed.getTime())) endDate = parsed;
    }

    const result = await this._bookingRepository.findAll(tenantId, {
      page,
      limit,
      serviceId: dto.service_id?.trim() || undefined,
      resourceId: dto.resource_id?.trim() || undefined,
      status: dto.status?.trim() || undefined,
      startDate,
      endDate,
      search: dto.search?.trim() || undefined,
      customerPhone: dto.customer_phone?.trim() || undefined,
    });

    return {
      bookings: result.bookings,
      total: result.total,
      page,
      limit,
    };
  }
}
