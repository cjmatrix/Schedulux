import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  AvailableSlotInfo,
  DayAvailabilityInfo,
  GetAvailabilityRequest,
  GetAvailabilityResponse,
  ResourceAvailabilityInfo,
} from '@repo/proto/scheduling';
import { ResourceEntity } from '../../../domain/entities/resource.entity.js';
import { IBookingRepository } from '../../../domain/repositories/booking.repository.interface.js';
import { IResourceRepository } from '../../../domain/repositories/resource.repository.interface.js';
import { IServiceRepository } from '../../../domain/repositories/service.repository.interface.js';
import { ITenantScheduleRepository } from '../../../domain/repositories/tenant-schedule.repository.interface.js';
import {
  BOOKING_REPOSITORY,
  RESOURCE_REPOSITORY,
  SERVICE_REPOSITORY,
  TENANT_SCHEDULE_REPOSITORY,
} from '../../../domain/tokens.js';
import { IGetAvailabilityUseCase } from '../../interfaces/booking-use-cases.interface.js';

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

@Injectable()
export class GetAvailabilityUseCase implements IGetAvailabilityUseCase {
  constructor(
    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: IServiceRepository,
    @Inject(RESOURCE_REPOSITORY)
    private readonly resourceRepository: IResourceRepository,
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,
    @Inject(TENANT_SCHEDULE_REPOSITORY)
    private readonly tenantScheduleRepository: ITenantScheduleRepository,
  ) {}

  async execute(dto: GetAvailabilityRequest): Promise<GetAvailabilityResponse> {
    const { tenant_id, agent_id, service_id } = dto;

   
    const [service, tenantSchedule] = await Promise.all([
      this.serviceRepository.findById(tenant_id, service_id),
      this.tenantScheduleRepository.findByTenantAndAgent(
        tenant_id,
        agent_id || undefined,
      ),
    ]);

    if (!service) {
      throw new NotFoundException(`Service not found: ${service_id}`);
    }

    const timezone = dto.timezone || tenantSchedule?.timezone || 'UTC';
    const bookingMode = service.bookingMode || tenantSchedule?.scheduling_engine?.booking_mode || 'time_slot';

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

    const todayStr = new Date().toISOString().split('T')[0];
    const startDateStr = dto.start_date || todayStr;
    let endDateStr = dto.end_date || startDateStr;

    if (!dto.end_date && bookingMode === 'date_range') {
      const endD = new Date(`${startDateStr}T00:00:00Z`);
      endD.setUTCDate(endD.getUTCDate() + 1);
      endDateStr = endD.toISOString().split('T')[0];
    }

    const startObj = new Date(`${startDateStr}T00:00:00Z`);
    let endObj = new Date(`${endDateStr}T00:00:00Z`);

    if (endObj < startObj) {
      endObj = new Date(startObj);
    }

    const MAX_DAYS_LIMIT = 31;
    const diffDays = Math.ceil((endObj.getTime() - startObj.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (diffDays > MAX_DAYS_LIMIT) {
      endObj = new Date(startObj);
      endObj.setUTCDate(endObj.getUTCDate() + (MAX_DAYS_LIMIT - 1));
      endDateStr = endObj.toISOString().split('T')[0];
    }

    const totalStartIso = `${startDateStr}T00:00:00.000Z`;
    const totalEndIso = `${endDateStr}T23:59:59.999Z`;
    const totalStartDate = new Date(totalStartIso);
    const totalEndDate = new Date(totalEndIso);

    const requirements = service.getEffectiveResourceRequirements();
    const allEligibleIdsSet = new Set<string>();
    requirements.forEach((req) => {
      req.eligibleResourceIds?.forEach((id) => allEligibleIdsSet.add(id));
    });
    const allEligibleIds = Array.from(allEligibleIdsSet);

    
    const [rawEligibleResources, activeBookings] = await Promise.all([
      allEligibleIds.length > 0
        ? this.resourceRepository.findActiveBookableByIds(
            tenant_id,
            allEligibleIds,
            agent_id || undefined,
          )
        : Promise.resolve([]),
      allEligibleIds.length > 0
        ? this.bookingRepository.findActiveBookingsInRange(
            tenant_id,
            allEligibleIds,
            totalStartDate,
            totalEndDate,
          )
        : Promise.resolve([]),
    ]);

    const activeEligibleResources = rawEligibleResources.filter(
      (r) => r.isBookable && r.dispatchStatus === 'active',
    );
    const activeEligibleIdsSet = new Set(activeEligibleResources.map((r) => r.id));

    const blackoutMap = new Map<string, { reason: string; is_closed: boolean }>();
    (tenantSchedule?.blackout_dates || []).forEach((b) => {
      blackoutMap.set(b.date, { reason: b.reason || 'Closed', is_closed: b.is_closed });
    });

    const operatingHours = tenantSchedule?.operating_hours;

    const daysList: DayAvailabilityInfo[] = [];
    const blockedDatesSet = new Set<string>();

    const getBusyResourceIdsInMemory = (
      start: Date,
      end: Date,
    ): Set<string> => {
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
    const curr = new Date(startObj);
    while (curr <= endObj && loopCount < MAX_DAYS_LIMIT) {
      loopCount++;
      const dateStr = curr.toISOString().split('T')[0];
      const dayOfWeekIdx = curr.getUTCDay();
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
        curr.setUTCDate(curr.getUTCDate() + 1);
        continue;
      }

     
      const dayIntervals = operatingHours
        ? (operatingHours as unknown as Record<string, Array<{ start: string; end: string }>>)[dayName] || []
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
          curr.setUTCDate(curr.getUTCDate() + 1);
          continue;
        }
      }

      if (bookingMode === 'time_slot') {
        const durationMins = service.durationMinutes || 30;
        const bufferMins = service.bufferMinutes || 0;
        const totalSlotDuration = durationMins + bufferMins;
        const slotIntervalMins = 15;

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
            const slotStartIso = `${dateStr}T${pad(slotHour)}:${pad(slotMinute)}:00.000Z`;

            const endSlotMin = m + durationMins;
            const endHourCalculated = Math.floor(endSlotMin / 60);
            const endMinCalculated = endSlotMin % 60;
            const slotEndIso = `${dateStr}T${pad(endHourCalculated)}:${pad(endMinCalculated)}:00.000Z`;

     
            const effectiveEndSlotMin = m + totalSlotDuration;
            const effEndHour = Math.floor(effectiveEndSlotMin / 60);
            const effEndMin = effectiveEndSlotMin % 60;
            const effectiveEndIso = `${dateStr}T${pad(effEndHour)}:${pad(effEndMin)}:00.000Z`;

            const busyResourceIds = getBusyResourceIdsInMemory(
              new Date(slotStartIso),
              new Date(effectiveEndIso),
            );

          
            let isSlotAvailable = true;
            const availableResourceIdsForSlot: string[] = [];

            if (requirements.length === 0) {
              isSlotAvailable = true;
            } else {
              for (const req of requirements) {
                const reqPool = req.eligibleResourceIds?.length
                  ? req.eligibleResourceIds
                  : allEligibleIds;

                const matchingRequested = requestedResourceIds.filter((id) => reqPool.includes(id));

                if (matchingRequested.length > 0) {
                  const hasUnavailable = matchingRequested.some(
                    (id) => busyResourceIds.has(id) || !activeEligibleResources.some((r) => r.id === id),
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
                    (id) => !busyResourceIds.has(id) && activeEligibleResources.some((r) => r.id === id),
                  ).length;
                  if (freeCount < Math.max(1, req.count || 1)) {
                    isSlotAvailable = false;
                    break;
                  }
                }
              }

              if (isSlotAvailable) {
                const freeActive = activeEligibleResources.filter((r) => !busyResourceIds.has(r.id));
                const selectableReqs = requirements.filter((r) => r.selectionMode === 'user_selectable');
                if (requestedResourceIds.length > 0) {
                  requestedResourceIds.forEach((id) => {
                    if (!busyResourceIds.has(id)) {
                      availableResourceIdsForSlot.push(id);
                    }
                  });
                } else if (selectableReqs.length > 0) {
                  const selectableIds = new Set(selectableReqs.flatMap((r) => r.eligibleResourceIds));
                  freeActive
                    .filter((r) => selectableIds.has(r.id))
                    .forEach((r) => availableResourceIdsForSlot.push(r.id));
                } else {
                  freeActive.forEach((r) => availableResourceIdsForSlot.push(r.id));
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
        
        const dayStartIso = `${dateStr}T00:00:00.000Z`;
        const dayEndIso = `${dateStr}T23:59:59.999Z`;

        const busyResourceIds = getBusyResourceIdsInMemory(
          new Date(dayStartIso),
          new Date(dayEndIso),
        );

        let hasAvailability = true;
        const freeResources = activeEligibleResources.filter((r) => !busyResourceIds.has(r.id));

        if (requirements.length === 0) {
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
              available_resource_ids: requestedResourceIds.length > 0
                ? (hasAvailability ? requestedResourceIds : [])
                : freeResources.map((r) => r.id),
              reason: hasAvailability ? undefined : 'All units booked on this date',
            },
          ],
        });

        if (!hasAvailability) {
          blockedDatesSet.add(dateStr);
        }
      }

      curr.setUTCDate(curr.getUTCDate() + 1);
    }

 
    const periodBusyIds = getBusyResourceIdsInMemory(totalStartDate, totalEndDate);

    const resourceAvailabilityList: ResourceAvailabilityInfo[] = activeEligibleResources.map((r) => ({
      resource_id: r.id,
      name: r.name,
      resource_type: r.resourceType,
      is_available: !periodBusyIds.has(r.id),
      busy_intervals: [],
    }));

    return {
      service_id,
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

function agentIdFilter(agentId?: string): string | undefined {
  return agentId && agentId.trim().length > 0 ? agentId : undefined;
}
