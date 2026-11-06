import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingEntity, BookingMode } from '../../domain/entities/booking.entity.js';
import { ResourceEntity } from '../../domain/entities/resource.entity.js';
import { ServiceEntity } from '../../domain/entities/service.entity.js';
import { IBookingRepository } from '../../domain/repositories/booking.repository.interface.js';
import { IResourceRepository } from '../../domain/repositories/resource.repository.interface.js';
import {
  AllocateResourcesParams,
  AllocateResourcesResult,
  BookingIntervalResult,
  IBookingAllocationService,
} from '../interfaces/booking-allocation-service.interface.js';
import { isDateBlackout, isResourceOnShift } from '../utils/shift-evaluation.helper.js';

export type {
  AllocateResourcesParams,
  AllocateResourcesResult,
  BookingIntervalResult,
  IBookingAllocationService,
};

@Injectable()
export class BookingAllocationService implements IBookingAllocationService {
  async resolveBookingByIdentifier(
    bookingRepository: IBookingRepository,
    tenantId: string,
    bookingIdentifier: string,
    agentId?: string,
  ): Promise<BookingEntity> {
    const trimmedId = bookingIdentifier?.trim();
    if (!trimmedId) {
      throw new BadRequestException('booking_id or booking_reference is required');
    }

    const booking = await bookingRepository.findByIdOrReference(tenantId, trimmedId);

    if (!booking) {
      throw new NotFoundException(`Booking "${trimmedId}" not found for tenant "${tenantId}"`);
    }

    if (agentId && booking.agentId?.trim() && booking.agentId.trim() !== agentId.trim()) {
      throw new BadRequestException(
        `Booking "${trimmedId}" belongs to agent ${booking.agentId}, but request specified agent ${agentId}`,
      );
    }

    return booking;
  }

  calculateBookingInterval(
    service: ServiceEntity,
    startTimeInput: string | Date,
    endTimeInput?: string | Date | null,
  ): BookingIntervalResult {
    const startTime = startTimeInput instanceof Date ? startTimeInput : new Date(startTimeInput);
    if (isNaN(startTime.getTime())) {
      throw new BadRequestException('Invalid start_time format');
    }

    const bookingMode = (service.bookingMode as BookingMode) || 'time_slot';
    let endTime: Date;
    let durationMinutes: number;

    if (bookingMode === 'date_range') {
      const todayUtc = new Date();
      todayUtc.setUTCHours(0, 0, 0, 0);
      if (startTime.getTime() < todayUtc.getTime()) {
        throw new BadRequestException('Check-in start_time cannot be in the past');
      }

      if (!endTimeInput) {
        throw new BadRequestException(
          'end_time (check-out date) is required for date_range bookings',
        );
      }
      endTime = endTimeInput instanceof Date ? endTimeInput : new Date(endTimeInput);
      if (isNaN(endTime.getTime())) {
        throw new BadRequestException('Invalid end_time format for date_range');
      }
      if (startTime >= endTime) {
        throw new BadRequestException('Check-out end_time must be after check-in start_time');
      }
      durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (60 * 1000));
    } else {
      const GRACE_PERIOD_MS = 5 * 60 * 1000;
      if (startTime.getTime() < Date.now() - GRACE_PERIOD_MS) {
        throw new BadRequestException('Booking start time cannot be in the past');
      }

      if (endTimeInput) {
        endTime = endTimeInput instanceof Date ? endTimeInput : new Date(endTimeInput);
        if (isNaN(endTime.getTime())) {
          throw new BadRequestException('Invalid end_time format');
        }
        durationMinutes = Math.max(
          1,
          Math.round((endTime.getTime() - startTime.getTime()) / (60 * 1000)),
        );
      } else {
        durationMinutes = service.durationMinutes || 30;
        endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
      }
      if (startTime >= endTime) {
        throw new BadRequestException('Booking start time must be before end time');
      }
    }

    const bufferMinutes = service.bufferMinutes || 0;
    const effectiveStartTime = startTime;
    const effectiveEndTime = new Date(endTime.getTime() + bufferMinutes * 60 * 1000);

    return {
      startTime,
      endTime,
      effectiveStartTime,
      effectiveEndTime,
      durationMinutes,
      bufferMinutes,
      bookingMode,
    };
  }

  async allocateResourcesForSlot(
    params: AllocateResourcesParams,
  ): Promise<AllocateResourcesResult> {
    const {
      tenantId,
      agentId,
      service,
      effectiveStartTime,
      effectiveEndTime,
      explicitResourceIds = [],
      excludeBookingId,
      resourceRepository,
      bookingRepository,
      timezone = 'UTC',
      tenantOperatingHours,
      blackoutDates = [],
    } = params;

    if (blackoutDates.length > 0) {
      const blackout = isDateBlackout(effectiveStartTime, timezone, blackoutDates);
      if (blackout.isBlackout) {
        throw new BadRequestException(
          `Cannot schedule a booking on a closed blackout date (${blackout.reason})`,
        );
      }
    }

    const sanitizedExplicit: string[] = [];
    for (const id of explicitResourceIds) {
      const trimmed = id?.trim();
      if (trimmed && !sanitizedExplicit.includes(trimmed)) {
        sanitizedExplicit.push(trimmed);
      }
    }

    const requirements = service.getEffectiveResourceRequirements();
    const allCandidateIdsSet = new Set<string>(sanitizedExplicit);
    for (const req of requirements) {
      if (req.eligibleResourceIds?.length) {
        for (const id of req.eligibleResourceIds) allCandidateIdsSet.add(id);
      }
    }
    const allCandidateIds = Array.from(allCandidateIdsSet);

    const [rawActiveResources, busyResourceIds] = await Promise.all([
      allCandidateIds.length > 0
        ? resourceRepository.findActiveBookableByIds(tenantId, allCandidateIds, agentId)
        : Promise.resolve([]),
      allCandidateIds.length > 0
        ? bookingRepository.findBusyResourceIds(
            tenantId,
            allCandidateIds,
            effectiveStartTime,
            effectiveEndTime,
            excludeBookingId,
          )
        : Promise.resolve(new Set<string>()),
    ]);

    const activeResourceMap = new Map<string, ResourceEntity>();
    for (const res of rawActiveResources) {
      activeResourceMap.set(res.id, res);
    }

    const allocatedResourceIds: string[] = [];
    const assignedAssetIds: string[] = [];
    const usedResourceIds = new Set<string>();

    for (const req of requirements) {
      const requiredCount = Math.max(1, req.count || 1);
      const eligiblePool = req.eligibleResourceIds || [];

      const matchingExplicit = sanitizedExplicit.filter(
        (id) => eligiblePool.includes(id) && !usedResourceIds.has(id),
      );

      for (const id of matchingExplicit) {
        const res = activeResourceMap.get(id);
        if (!res) {
          throw new BadRequestException(
            `Selected resource (${id}) for role "${req.role}" is currently inactive, on leave, or not bookable`,
          );
        }
        if (
          !isResourceOnShift(
            res,
            effectiveStartTime,
            effectiveEndTime,
            timezone,
            tenantOperatingHours,
            service.bookingMode,
          )
        ) {
          throw new ConflictException(
            `Resource "${res.name || 'Resource'}" for role "${req.role}" is not on duty during this time slot`,
          );
        }
        if (busyResourceIds.has(id)) {
          throw new ConflictException(
            `Resource "${res.name || 'Resource'}" for role "${req.role}" is already booked for this time slot`,
          );
        }
        allocatedResourceIds.push(id);
        usedResourceIds.add(id);
        if (req.resourceType !== 'staff') assignedAssetIds.push(id);
      }

      const remainingNeeded = requiredCount - matchingExplicit.length;
      if (remainingNeeded > 0) {
        const candidates = eligiblePool.filter((id) => !usedResourceIds.has(id));
        if (candidates.length === 0) {
          throw new ConflictException(
            `Not enough eligible resources configured to satisfy requirement for role "${req.role}" (requires ${requiredCount})`,
          );
        }

        const activeCandidates = candidates
          .map((id) => activeResourceMap.get(id))
          .filter((res): res is ResourceEntity => res !== undefined);

        if (activeCandidates.length < remainingNeeded) {
          throw new ConflictException(
            `Not enough active/bookable resources available for role "${req.role}". Required: ${requiredCount}, Available active: ${activeCandidates.length + matchingExplicit.length}`,
          );
        }

        const freeCandidates = activeCandidates.filter(
          (c) =>
            !busyResourceIds.has(c.id) &&
            isResourceOnShift(
              c,
              effectiveStartTime,
              effectiveEndTime,
              timezone,
              tenantOperatingHours,
              service.bookingMode,
            ),
        );
        if (freeCandidates.length < remainingNeeded) {
          throw new ConflictException(
            `Conflict: Not enough available on-duty resources for role "${req.role}" (${requiredCount} required, only ${freeCandidates.length + matchingExplicit.length} available on shift for this slot)`,
          );
        }

        for (let i = 0; i < remainingNeeded; i++) {
          const chosen = freeCandidates[i];
          allocatedResourceIds.push(chosen.id);
          usedResourceIds.add(chosen.id);
          if (req.resourceType !== 'staff') assignedAssetIds.push(chosen.id);
        }
      }
    }

    const leftoverExplicit = sanitizedExplicit.filter((id) => !usedResourceIds.has(id));
    if (leftoverExplicit.length > 0) {
      throw new BadRequestException(
        `Resource(s) not eligible for service "${service.name}" or requirement count exceeded: ${leftoverExplicit.join(', ')}`,
      );
    }

    return {
      allocatedResourceIds,
      assignedAssetIds,
      activeResourceMap,
    };
  }
}
