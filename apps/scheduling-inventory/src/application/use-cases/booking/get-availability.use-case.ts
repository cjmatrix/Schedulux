import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import dayjs from 'dayjs';
import timezonePlugin from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

import {
  AvailableSlotInfo,
  DayAvailabilityInfo,
  GetAvailabilityRequest,
  GetAvailabilityResponse,
  ResourceAvailabilityInfo,
} from '@repo/proto/scheduling';
import { IBookingRepository } from '../../../domain/repositories/booking.repository.interface.js';
import { IResourceRepository } from '../../../domain/repositories/resource.repository.interface.js';
import { IServiceRepository } from '../../../domain/repositories/service.repository.interface.js';
import { ITenantScheduleRepository } from '../../../domain/repositories/tenant-schedule.repository.interface.js';
import {
  BOOKING_REPOSITORY,
  CACHE_REPOSITORY,
  RESOURCE_REPOSITORY,
  SERVICE_REPOSITORY,
  TENANT_SCHEDULE_REPOSITORY,
} from '../../../domain/tokens.js';
import type { ICacheRepository } from '../../../infrastructure/cache/cache-repository.interface.js';
import { IGetAvailabilityUseCase } from '../../interfaces/booking-use-cases.interface.js';
import { getCachedService } from '../../utils/service-cache.helper.js';

const DAY_NAMES = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

@Injectable()
export class GetAvailabilityUseCase implements IGetAvailabilityUseCase {
  constructor(
    @Inject(SERVICE_REPOSITORY)
    private readonly _serviceRepository: IServiceRepository,
    @Inject(RESOURCE_REPOSITORY)
    private readonly _resourceRepository: IResourceRepository,
    @Inject(BOOKING_REPOSITORY)
    private readonly _bookingRepository: IBookingRepository,
    @Inject(TENANT_SCHEDULE_REPOSITORY)
    private readonly _tenantScheduleRepository: ITenantScheduleRepository,
    @Inject(CACHE_REPOSITORY)
    private readonly _cacheRepo: ICacheRepository,
  ) {}

  async execute(dto: GetAvailabilityRequest): Promise<GetAvailabilityResponse> {
    if (!dto.tenant_id?.trim()) throw new BadRequestException('tenant_id is required');
    if (!dto.agent_id?.trim()) throw new BadRequestException('agent_id is required');
    if (!dto.service_id?.trim()) throw new BadRequestException('service_id is required');

    const tenantId = dto.tenant_id.trim();
    const agentId = dto.agent_id.trim();
    const serviceId = dto.service_id.trim();

    const [service, tenantSchedule] = await Promise.all([
      getCachedService(this._serviceRepository, this._cacheRepo, tenantId, serviceId),
      this._tenantScheduleRepository.findByTenantAndAgent(tenantId, agentId),
    ]);

    if (!service) {
      throw new NotFoundException(`Service not found: ${serviceId}`);
    }

    const timezone = dto.timezone || tenantSchedule?.timezone || 'UTC';
    const bookingMode =
      service.bookingMode || tenantSchedule?.scheduling_engine?.booking_mode || 'time_slot';

    const requestedResourceIds: string[] = [];
    if (dto.resource_ids && dto.resource_ids.length > 0) {
      for (const id of dto.resource_ids) {
        if (id && id.trim() && !requestedResourceIds.includes(id.trim())) {
          requestedResourceIds.push(id.trim());
        }
      }
    } else if (dto.resource_id && dto.resource_id.trim()) {
      requestedResourceIds.push(dto.resource_id.trim());
    }

    const todayStr = dayjs().tz(timezone).format('YYYY-MM-DD');
    const startDateStr = dto.start_date || todayStr;
    let endDateStr = dto.end_date || startDateStr;

    if (!dto.end_date && bookingMode === 'date_range') {
      endDateStr = dayjs.tz(startDateStr, timezone).add(1, 'day').format('YYYY-MM-DD');
    }

    const startObj = dayjs.tz(startDateStr, timezone).startOf('day');
    let endObj = dayjs.tz(endDateStr, timezone).startOf('day');

    if (endObj.isBefore(startObj)) {
      endObj = startObj;
      endDateStr = startDateStr;
    }

    const MAX_DAYS_LIMIT = 31;
    const diffDays = endObj.diff(startObj, 'day') + 1;
    if (diffDays > MAX_DAYS_LIMIT) {
      endObj = startObj.add(MAX_DAYS_LIMIT - 1, 'day');
      endDateStr = endObj.format('YYYY-MM-DD');
    }

    const maxAdvanceDays = tenantSchedule?.scheduling_engine?.max_advance_booking_days ?? 60;
    const maxBookingDate = dayjs().tz(timezone).add(maxAdvanceDays, 'day').endOf('day');
    if (endObj.isAfter(maxBookingDate)) {
      endObj = maxBookingDate;
      endDateStr = endObj.format('YYYY-MM-DD');
    }

    const totalStartDate = startObj.startOf('day').toDate();
    const totalEndDate = endObj.endOf('day').toDate();

    const requirements = service.getEffectiveResourceRequirements();
    const allEligibleIdsSet = new Set<string>();
    requirements.forEach((req) => {
      req.eligibleResourceIds?.forEach((id) => {
        allEligibleIdsSet.add(id);
      });
    });
    const allEligibleIds = Array.from(allEligibleIdsSet);

    const [rawEligibleResources, activeBookings] = await Promise.all([
      allEligibleIds.length > 0
        ? this._resourceRepository.findActiveBookableByIds(tenantId, allEligibleIds, agentId)
        : Promise.resolve([]),
      allEligibleIds.length > 0
        ? this._bookingRepository.findActiveBookingsInRange(
            tenantId,
            allEligibleIds,
            totalStartDate,
            totalEndDate,
          )
        : Promise.resolve([]),
    ]);

    const activeEligibleResources = rawEligibleResources;
    const activeEligibleIdsSet = new Set(activeEligibleResources.map((r) => r.id));

    const blackoutMap = new Map<string, { reason: string; is_closed: boolean }>();
    (tenantSchedule?.blackout_dates || []).forEach((b) => {
      blackoutMap.set(b.date, { reason: b.reason || 'Closed', is_closed: b.is_closed });
    });

    const operatingHours = tenantSchedule?.operating_hours;

    const daysList: DayAvailabilityInfo[] = [];
    const blockedDatesSet = new Set<string>();

    const getBusyResourceIdsInMemory = (start: Date, end: Date): Set<string> => {
      const busy = new Set<string>();
      for (const b of activeBookings) {
        if (b.start_time < end && b.effective_end_time > start) {
          if (b.resource_id && activeEligibleIdsSet.has(b.resource_id)) {
            busy.add(b.resource_id);
          }
          if (Array.isArray(b.resource_ids)) {
            for (const id of b.resource_ids) {
              if (activeEligibleIdsSet.has(id)) busy.add(id);
            }
          }
          if (Array.isArray(b.assigned_asset_ids)) {
            for (const id of b.assigned_asset_ids) {
              if (activeEligibleIdsSet.has(id)) busy.add(id);
            }
          }
        }
      }
      return busy;
    };

    let loopCount = 0;
    let currDay = startObj;
    while (
      (currDay.isBefore(endObj) || currDay.isSame(endObj, 'day')) &&
      loopCount < MAX_DAYS_LIMIT
    ) {
      loopCount++;
      const dateStr = currDay.format('YYYY-MM-DD');
      const dayOfWeekIdx = currDay.day();
      const dayName = DAY_NAMES[dayOfWeekIdx];

      const blackout = blackoutMap.get(dateStr);
      if (blackout && blackout.is_closed) {
        daysList.push({
          date: dateStr,
          is_closed: true,
          closure_reason: blackout.reason || 'Blackout date',
          has_availability: false,
          slots: [],
        });
        blockedDatesSet.add(dateStr);
        currDay = currDay.add(1, 'day');
        continue;
      }

      const dayIntervals = operatingHours
        ? (operatingHours as unknown as Record<string, Array<{ start: string; end: string }>>)[
            dayName
          ] || []
        : [];
      if (!operatingHours || dayIntervals.length === 0) {
        if (!operatingHours && dayOfWeekIdx >= 1 && dayOfWeekIdx <= 5) {
          dayIntervals.push({ start: '08:00', end: '18:00' });
        } else {
          daysList.push({
            date: dateStr,
            is_closed: true,
            closure_reason: 'Closed on this day',
            has_availability: false,
            slots: [],
          });
          currDay = currDay.add(1, 'day');
          continue;
        }
      }

      if (bookingMode === 'time_slot') {
        const durationMins = service.durationMinutes || 30;
        const bufferMins = service.bufferMinutes || 0;
        const totalSlotDuration = durationMins + bufferMins;
        const slotIntervalMins = totalSlotDuration > 0 ? totalSlotDuration : 15;

        const daySlots: AvailableSlotInfo[] = [];

        for (const interval of dayIntervals) {
          const [startHour, startMin] = interval.start.split(':').map(Number);
          const [endHour, endMin] = interval.end.split(':').map(Number);

          const intervalStartMinutes = startHour * 60 + startMin;
          const intervalEndMinutes = endHour * 60 + endMin;

          for (
            let m = intervalStartMinutes;
            m + durationMins <= intervalEndMinutes;
            m += slotIntervalMins
          ) {
            const slotHour = Math.floor(m / 60);
            const slotMinute = m % 60;

            const slotStart = currDay.hour(slotHour).minute(slotMinute).second(0).millisecond(0);
            const slotEnd = slotStart.add(durationMins, 'minute');
            const effectiveEnd = slotStart.add(totalSlotDuration, 'minute');

            const slotStartIso = slotStart.format();
            const slotEndIso = slotEnd.format();

            const slotStartDate = slotStart.toDate();
            const effectiveEndDate = effectiveEnd.toDate();

            const leadTimeHours = tenantSchedule?.scheduling_engine?.default_lead_time_hours ?? 2;
            const minSlotTime = Date.now() + leadTimeHours * 3600 * 1000;
            const isSlotPast = slotStartDate.getTime() < minSlotTime;

            const busyResourceIds = getBusyResourceIdsInMemory(
              slotStartDate,
              effectiveEndDate,
            );

            let isSlotAvailable = !isSlotPast;
            const availableResourceIdsForSlot: string[] = [];

            if (isSlotPast) {
              isSlotAvailable = false;
            } else if (requirements.length === 0) {
              isSlotAvailable = true;
            } else {
              for (const req of requirements) {
                const reqPool = req.eligibleResourceIds?.length
                  ? req.eligibleResourceIds
                  : allEligibleIds;

                const matchingRequested = requestedResourceIds.filter((id) => reqPool.includes(id));

                if (matchingRequested.length > 0) {
                  const hasUnavailable = matchingRequested.some(
                    (id) =>
                      busyResourceIds.has(id) || !activeEligibleResources.some((r) => r.id === id),
                  );
                  if (hasUnavailable) {
                    isSlotAvailable = false;
                    break;
                  }
                  const remainingNeeded = Math.max(1, req.count || 1) - matchingRequested.length;
                  if (remainingNeeded > 0) {
                    const otherFreeCount = reqPool.filter(
                      (id) =>
                        !matchingRequested.includes(id) &&
                        !busyResourceIds.has(id) &&
                        activeEligibleResources.some((r) => r.id === id),
                    ).length;
                    if (otherFreeCount < remainingNeeded) {
                      isSlotAvailable = false;
                      break;
                    }
                  }
                } else {
                  const freeCount = reqPool.filter(
                    (id) =>
                      !busyResourceIds.has(id) && activeEligibleResources.some((r) => r.id === id),
                  ).length;
                  if (freeCount < Math.max(1, req.count || 1)) {
                    isSlotAvailable = false;
                    break;
                  }
                }
              }

              if (isSlotAvailable) {
                const freeActive = activeEligibleResources.filter(
                  (r) => !busyResourceIds.has(r.id),
                );
                const selectableReqs = requirements.filter(
                  (r) => r.selectionMode === 'user_selectable',
                );
                if (requestedResourceIds.length > 0) {
                  requestedResourceIds.forEach((id) => {
                    if (!busyResourceIds.has(id)) {
                      availableResourceIdsForSlot.push(id);
                    }
                  });
                } else if (selectableReqs.length > 0) {
                  const selectableIds = new Set(
                    selectableReqs.flatMap((r) => r.eligibleResourceIds),
                  );
                  freeActive
                    .filter((r) => selectableIds.has(r.id))
                    .forEach((r) => {
                      availableResourceIdsForSlot.push(r.id);
                    });
                } else {
                  freeActive.forEach((r) => {
                    availableResourceIdsForSlot.push(r.id);
                  });
                }
              }
            }

            daySlots.push({
              start_time: slotStartIso,
              end_time: slotEndIso,
              available: isSlotAvailable,
              available_resource_ids: availableResourceIdsForSlot,
              reason: isSlotAvailable ? undefined : 'Resource(s) already booked',
            });
          }
        }

        const hasAnyAvailable = daySlots.some((s) => s.available);
        daysList.push({
          date: dateStr,
          is_closed: false,
          has_availability: hasAnyAvailable,
          slots: daySlots,
        });
        if (!hasAnyAvailable) {
          blockedDatesSet.add(dateStr);
        }
      } else {
        const dayStart = currDay.startOf('day');
        const dayEnd = currDay.endOf('day');
        const dayStartIso = dayStart.format();
        const dayEndIso = dayEnd.format();

        const busyResourceIds = getBusyResourceIdsInMemory(
          dayStart.toDate(),
          dayEnd.toDate(),
        );

        const todayZoned = dayjs().tz(timezone).format('YYYY-MM-DD');
        const isPastDay = dateStr < todayZoned;

        let hasAvailability = !isPastDay;
        const freeResources = activeEligibleResources.filter((r) => !busyResourceIds.has(r.id));

        if (isPastDay) {
          hasAvailability = false;
        } else if (requirements.length === 0) {
          hasAvailability = true;
        } else if (requestedResourceIds.length > 0) {
          hasAvailability = requestedResourceIds.every(
            (id) => !busyResourceIds.has(id) && activeEligibleResources.some((r) => r.id === id),
          );
        } else {
          hasAvailability = freeResources.length > 0;
        }

        daysList.push({
          date: dateStr,
          is_closed: false,
          has_availability: hasAvailability,
          slots: [
            {
              start_time: dayStartIso,
              end_time: dayEndIso,
              available: hasAvailability,
              available_resource_ids:
                requestedResourceIds.length > 0
                  ? hasAvailability
                    ? requestedResourceIds
                    : []
                  : freeResources.map((r) => r.id),
              reason: hasAvailability ? undefined : 'All units booked on this date',
            },
          ],
        });

        if (!hasAvailability) {
          blockedDatesSet.add(dateStr);
        }
      }

      currDay = currDay.add(1, 'day');
    }

    const periodBusyIds = getBusyResourceIdsInMemory(totalStartDate, totalEndDate);

    const resourceAvailabilityList: ResourceAvailabilityInfo[] = activeEligibleResources.map(
      (r) => ({
        resource_id: r.id,
        name: r.name,
        resource_type: r.resourceType,
        is_available: !periodBusyIds.has(r.id),
        busy_intervals: [],
      }),
    );

    return {
      service_id: serviceId,
      booking_mode: bookingMode,
      timezone,
      days: daysList,
      resources: resourceAvailabilityList,
      blocked_dates: Array.from(blockedDatesSet),
    };
  }
}

function pad(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

function _agentIdFilter(agentId?: string): string | undefined {
  return agentId && agentId.trim().length > 0 ? agentId : undefined;
}
