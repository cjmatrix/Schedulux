import dayjs from 'dayjs';
import timezonePlugin from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
import type { ResourceEntity } from '../../domain/entities/resource.entity.js';

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

export interface ShiftInterval {
  start: string;
  end: string;
}

export function isDateBlackout(
  date: Date,
  timezone: string = 'UTC',
  blackoutDates?: Array<{ date: string; reason?: string; is_closed?: boolean }>,
): { isBlackout: boolean; reason?: string } {
  if (!blackoutDates || blackoutDates.length === 0) {
    return { isBlackout: false };
  }
  const dateStr = dayjs(date).tz(timezone).format('YYYY-MM-DD');
  const match = blackoutDates.find((b) => b.date === dateStr);
  if (match && match.is_closed) {
    return { isBlackout: true, reason: match.reason || 'Closed for blackout/holiday' };
  }
  return { isBlackout: false };
}

export function isResourceOnShift(
  resource: ResourceEntity,
  startTime: Date,
  endTime: Date,
  timezone: string = 'UTC',
  tenantOperatingHours?: Record<string, ShiftInterval[]>,
  bookingMode: string = 'time_slot',
): boolean {
  if (bookingMode === 'date_range') {
    const startDayjs = dayjs(startTime).tz(timezone).startOf('day');
    const endDayjs = dayjs(endTime).tz(timezone).startOf('day');

    let overrides: Record<string, ShiftInterval[]> = {};
    try {
      if (resource.customShiftOverridesJson && resource.customShiftOverridesJson !== '{}') {
        overrides = JSON.parse(resource.customShiftOverridesJson);
      }
    } catch {
      overrides = {};
    }

    let curr = startDayjs;
    while (curr.isBefore(endDayjs) || curr.isSame(endDayjs, 'day')) {
      const dName = curr.format('dddd').toLowerCase();
      if (overrides[dName] !== undefined && overrides[dName].length === 0) {
        return false;
      }
      curr = curr.add(1, 'day');
    }
    return true;
  }

  const startDayjs = dayjs(startTime).tz(timezone);
  const endDayjs = dayjs(endTime).tz(timezone);
  const dayName = startDayjs.format('dddd').toLowerCase();

  let overrides: Record<string, ShiftInterval[]> = {};
  try {
    if (resource.customShiftOverridesJson && resource.customShiftOverridesJson !== '{}') {
      overrides = JSON.parse(resource.customShiftOverridesJson);
    }
  } catch {
    overrides = {};
  }

  let intervals: ShiftInterval[] = [];
  if (overrides[dayName] !== undefined) {
    intervals = overrides[dayName] || [];
    if (intervals.length === 0) {
      return false;
    }
  } else if (tenantOperatingHours && tenantOperatingHours[dayName] !== undefined) {
    intervals = tenantOperatingHours[dayName] || [];
    if (intervals.length === 0) {
      return false;
    }
  } else {
    return true;
  }

  const slotStartMinutes = startDayjs.hour() * 60 + startDayjs.minute();
  let slotEndMinutes = endDayjs.hour() * 60 + endDayjs.minute();
  if (endDayjs.isAfter(startDayjs, 'day') || (slotEndMinutes === 0 && endDayjs.isAfter(startDayjs))) {
    slotEndMinutes += 24 * 60;
  }

  return intervals.some((interval) => {
    const [sh, sm] = interval.start.split(':').map(Number);
    const [eh, em] = interval.end.split(':').map(Number);
    const intStartMinutes = sh * 60 + sm;
    let intEndMinutes = eh * 60 + em;
    if (intEndMinutes === 0 && eh === 0 && em === 0) {
      intEndMinutes = 24 * 60;
    }
    return slotStartMinutes >= intStartMinutes && slotEndMinutes <= intEndMinutes;
  });
}

