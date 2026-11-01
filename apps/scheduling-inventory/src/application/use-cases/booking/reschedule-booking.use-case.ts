import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { RescheduleBookingRequest } from '@repo/proto/scheduling';
import { BookingEntity } from '../../../domain/entities/booking.entity.js';
import type { IBookingRepository } from '../../../domain/repositories/booking.repository.interface.js';
import type { IResourceRepository } from '../../../domain/repositories/resource.repository.interface.js';
import type { IServiceRepository } from '../../../domain/repositories/service.repository.interface.js';
import type { IUnitOfWork } from '../../../domain/repositories/unit-of-work.interface.js';
import {
  BOOKING_ALLOCATION_SERVICE,
  BOOKING_REPOSITORY,
  CACHE_REPOSITORY,
  RESOURCE_REPOSITORY,
  SCHEDULING_EVENTS_PRODUCER,
  SERVICE_REPOSITORY,
  UNIT_OF_WORK,
} from '../../../domain/tokens.js';
import type { ICacheRepository } from '../../../infrastructure/cache/cache-repository.interface.js';
import type { IBookingAllocationService } from '../../interfaces/booking-allocation-service.interface.js';
import { IRescheduleBookingUseCase } from '../../interfaces/booking-use-cases.interface.js';
import type { ISchedulingEventsProducer } from '../../interfaces/scheduling-events-producer.interface.js';
import { getCachedService } from '../../utils/service-cache.helper.js';

@Injectable()
export class RescheduleBookingUseCase implements IRescheduleBookingUseCase {
  private readonly _logger = new Logger(RescheduleBookingUseCase.name);

  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly _bookingRepository: IBookingRepository,
    @Inject(SERVICE_REPOSITORY)
    private readonly _serviceRepository: IServiceRepository,
    @Inject(RESOURCE_REPOSITORY)
    private readonly _resourceRepository: IResourceRepository,
    @Inject(UNIT_OF_WORK)
    private readonly _unitOfWork: IUnitOfWork,
    @Inject(SCHEDULING_EVENTS_PRODUCER)
    private readonly _eventsProducer: ISchedulingEventsProducer,
    @Inject(BOOKING_ALLOCATION_SERVICE)
    private readonly _bookingAllocationService: IBookingAllocationService,
    @Inject(CACHE_REPOSITORY)
    private readonly _cacheRepo: ICacheRepository,
  ) {}

  async execute(dto: RescheduleBookingRequest): Promise<BookingEntity> {
    if (!dto.tenant_id?.trim()) throw new BadRequestException('tenant_id is required');
    if (!dto.agent_id?.trim()) throw new BadRequestException('agent_id is required');
    if (!dto.booking_id?.trim())
      throw new BadRequestException('booking_id or booking_reference is required');
    if (!dto.new_start_time?.trim()) throw new BadRequestException('new_start_time is required');

    const tenantId = dto.tenant_id.trim();
    const agentId = dto.agent_id.trim();
    const bookingIdentifier = dto.booking_id.trim();

    const booking = await this._bookingAllocationService.resolveBookingByIdentifier(
      this._bookingRepository,
      tenantId,
      bookingIdentifier,
      agentId,
    );

    if (booking.status === 'cancelled') {
      throw new BadRequestException('Cannot reschedule a cancelled booking');
    }
    if (booking.status === 'completed') {
      throw new BadRequestException('Cannot reschedule a completed booking');
    }

    const service = await getCachedService(
      this._serviceRepository,
      this._cacheRepo,
      tenantId,
      booking.serviceId,
    );
    if (!service) {
      throw new NotFoundException(
        `Service "${booking.serviceId}" not found for tenant "${tenantId}"`,
      );
    }

    const interval = this._bookingAllocationService.calculateBookingInterval(
      service,
      dto.new_start_time,
      dto.new_end_time,
    );

    const explicitResourceIds: string[] = dto.resource_ids?.length
      ? dto.resource_ids
      : dto.resource_id
        ? [dto.resource_id]
        : booking.resourceIds;

    const allocation = await this._bookingAllocationService.allocateResourcesForSlot({
      tenantId,
      agentId,
      service,
      effectiveStartTime: interval.effectiveStartTime,
      effectiveEndTime: interval.effectiveEndTime,
      explicitResourceIds,
      excludeBookingId: booking.id,
      resourceRepository: this._resourceRepository,
      bookingRepository: this._bookingRepository,
    });

    const previousStartTime = booking.startTime;
    const previousEndTime = booking.endTime;

    try {
      booking.reschedule({
        startTime: interval.startTime,
        endTime: interval.endTime,
        effectiveEndTime: interval.effectiveEndTime,
        durationMinutes: interval.durationMinutes,
        resourceIds: allocation.allocatedResourceIds,
        assignedAssetIds: allocation.assignedAssetIds,
        notes: dto.notes?.trim() || undefined,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new BadRequestException(msg);
    }

    const { updatedBooking, outboxDoc } = await this._unitOfWork.withTransaction(async () => {
      const updated = await this._bookingRepository.update(booking);
      if (!updated) {
        throw new BadRequestException('Failed to update rescheduled booking in database');
      }

      const outbox = await this._eventsProducer.createBookingRescheduledOutboxEvent(
        updated,
        previousStartTime,
        previousEndTime,
      );

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
