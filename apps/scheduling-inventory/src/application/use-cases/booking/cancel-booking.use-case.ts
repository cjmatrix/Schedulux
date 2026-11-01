import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import type { CancelBookingRequest } from '@repo/proto/scheduling';
import { BookingEntity } from '../../../domain/entities/booking.entity.js';
import type { IBookingRepository } from '../../../domain/repositories/booking.repository.interface.js';
import type { IUnitOfWork } from '../../../domain/repositories/unit-of-work.interface.js';
import {
  BOOKING_ALLOCATION_SERVICE,
  BOOKING_REPOSITORY,
  SCHEDULING_EVENTS_PRODUCER,
  UNIT_OF_WORK,
} from '../../../domain/tokens.js';
import type { IBookingAllocationService } from '../../interfaces/booking-allocation-service.interface.js';
import { ICancelBookingUseCase } from '../../interfaces/booking-use-cases.interface.js';
import type { ISchedulingEventsProducer } from '../../interfaces/scheduling-events-producer.interface.js';

@Injectable()
export class CancelBookingUseCase implements ICancelBookingUseCase {
  private readonly _logger = new Logger(CancelBookingUseCase.name);

  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly _bookingRepository: IBookingRepository,
    @Inject(UNIT_OF_WORK)
    private readonly _unitOfWork: IUnitOfWork,
    @Inject(SCHEDULING_EVENTS_PRODUCER)
    private readonly _eventsProducer: ISchedulingEventsProducer,
    @Inject(BOOKING_ALLOCATION_SERVICE)
    private readonly _bookingAllocationService: IBookingAllocationService,
  ) {}

  async execute(dto: CancelBookingRequest): Promise<BookingEntity> {
    if (!dto.tenant_id?.trim()) throw new BadRequestException('tenant_id is required');
    if (!dto.agent_id?.trim()) throw new BadRequestException('agent_id is required');
    if (!dto.booking_id?.trim())
      throw new BadRequestException('booking_id or booking_reference is required');

    const tenantId = dto.tenant_id.trim();
    const agentId = dto.agent_id.trim();
    const bookingIdentifier = dto.booking_id.trim();
    const reason = dto.reason?.trim() || '';
    const cancelledBy = dto.cancelled_by?.trim() || 'system';

    const booking = await this._bookingAllocationService.resolveBookingByIdentifier(
      this._bookingRepository,
      tenantId,
      bookingIdentifier,
      agentId,
    );

    try {
      booking.cancel(reason, cancelledBy);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new BadRequestException(msg);
    }

    const { updatedBooking, outboxDoc } = await this._unitOfWork.withTransaction(async () => {
      const updated = await this._bookingRepository.update(booking);
      if (!updated) {
        throw new BadRequestException('Failed to update booking status in database');
      }

      const outbox = await this._eventsProducer.createBookingCancelledOutboxEvent(updated, reason);

      return { updatedBooking: updated, outboxDoc: outbox };
    });

    this._eventsProducer.publishOutboxEvent(outboxDoc).catch((err: unknown) => {
      this._logger.error(
        `Immediate outbox dispatch failed for ${outboxDoc._id}: ${err}. Recovery sweeper will retry.`,
      );
    });

    return updatedBooking;
  }
}
