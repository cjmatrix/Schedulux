export const IGNORED_DIFF_KEYS = new Set([
  'status',
  'schema_ref',
  'runtime_meta',
  'tenant_id',
  'agent_id',
  'compiled_at',
  'created_at',
  'updated_at',
  'schema_version',
  'creation_source',
  '_id',
]);

export function cleanForDiff(val: unknown): unknown {
  if (val === null || val === undefined) return undefined;
  if (Array.isArray(val)) {
    return val.map(cleanForDiff).filter((item) => item !== undefined);
  }
  if (typeof val === 'object') {
    const cleanedObj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val)) {
      if (IGNORED_DIFF_KEYS.has(k)) continue;
      const cleanedVal = cleanForDiff(v);
      if (cleanedVal !== undefined) {
        cleanedObj[k] = cleanedVal;
      }
    }
    return Object.keys(cleanedObj).length > 0 ? cleanedObj : undefined;
  }
  return val;
}

export function formatTime12h(time24?: string): string {
  if (!time24) return '08:00 AM';
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const m = mStr || '00';
  if (Number.isNaN(h)) return time24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12.toString().padStart(2, '0')}:${m} ${ampm}`;
}

export function calculateDailyHours(
  startOrSlots?: string | Array<{ start?: string; end?: string }>,
  end?: string,
): string {
  if (Array.isArray(startOrSlots)) {
    let totalMinutes = 0;
    for (const slot of startOrSlots) {
      if (!slot?.start || !slot?.end) continue;
      const [sh, sm] = slot.start.split(':').map(Number);
      const [eh, em] = slot.end.split(':').map(Number);
      if (!Number.isNaN(sh) && !Number.isNaN(eh)) {
        const diff = eh * 60 + (em || 0) - (sh * 60 + (sm || 0));
        if (diff > 0) totalMinutes += diff;
      }
    }
    const diffHours = totalMinutes / 60;
    return `${diffHours > 0 ? Number(diffHours.toFixed(1)) : 8} hrs/day`;
  }
  if (!startOrSlots || !end) return '10 hrs/day';
  const [sh, sm] = startOrSlots.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  if (Number.isNaN(sh) || Number.isNaN(eh)) return '10 hrs/day';
  const diffHours = (eh * 60 + (em || 0) - (sh * 60 + (sm || 0))) / 60;
  return `${diffHours > 0 ? Number(diffHours.toFixed(1)) : 8} hrs/day`;
}

export interface ScheduleGroup {
  label: string;
  timeText: string;
  rawStart?: string;
  rawEnd?: string;
  isOpen: boolean;
  dailyHoursText?: string;
  days: string[];
}

interface DayInfo {
  key: string;
  label: string;
  timeKey: string;
  timeText: string;
  rawStart?: string;
  rawEnd?: string;
  isOpen: boolean;
  dailyHoursText?: string;
}

export function getOperatingScheduleGroups(
  operatingHours?: Record<string, Array<{ start?: string; end?: string }>> | null,
): ScheduleGroup[] {
  if (!operatingHours || typeof operatingHours !== 'object') {
    return [];
  }

  const daysOrder = [
    { key: 'monday', label: 'Mon' },
    { key: 'tuesday', label: 'Tue' },
    { key: 'wednesday', label: 'Wed' },
    { key: 'thursday', label: 'Thu' },
    { key: 'friday', label: 'Fri' },
    { key: 'saturday', label: 'Sat' },
    { key: 'sunday', label: 'Sun' },
  ];

  const dayInfos: DayInfo[] = daysOrder.map((day) => {
    const slots = operatingHours[day.key];
    const isOpen = Array.isArray(slots) && slots.length > 0 && Boolean(slots[0]?.start);
    if (!isOpen || !slots) {
      return {
        key: day.key,
        label: day.label,
        timeKey: 'closed',
        timeText: 'Closed',
        isOpen: false,
      };
    }

    const start = slots[0]?.start;
    const end = slots[0]?.end;
    const timeKey = slots.map((s) => `${s.start}-${s.end}`).join(';');
    const timeText = slots
      .map((s) => `${formatTime12h(s.start)} – ${formatTime12h(s.end)}`)
      .join(', ');
    const dailyHoursText = calculateDailyHours(slots);

    return {
      key: day.key,
      label: day.label,
      timeKey,
      timeText,
      rawStart: start,
      rawEnd: end,
      isOpen: true,
      dailyHoursText,
    };
  });

  const groups: ScheduleGroup[] = [];
  let currentGroup: DayInfo[] = [];

  for (const dayInfo of dayInfos) {
    if (currentGroup.length === 0) {
      currentGroup.push(dayInfo);
    } else if (currentGroup[0].timeKey === dayInfo.timeKey) {
      currentGroup.push(dayInfo);
    } else {
      groups.push(buildGroup(currentGroup));
      currentGroup = [dayInfo];
    }
  }

  if (currentGroup.length > 0) {
    groups.push(buildGroup(currentGroup));
  }

  return groups;
}

function buildGroup(days: DayInfo[]): ScheduleGroup {
  const first = days[0];
  const last = days[days.length - 1];
  let label = first.label;

  if (days.length === 7) {
    label = 'Mon – Sun';
  } else if (days.length > 1) {
    label = `${first.label} – ${last.label}`;
  }

  return {
    label,
    timeText: first.timeText,
    rawStart: first.rawStart,
    rawEnd: first.rawEnd,
    isOpen: first.isOpen,
    dailyHoursText: first.dailyHoursText,
    days: days.map((d) => d.label),
  };
}

export function formatPrice(amount?: number, currency = 'INR', type = 'fixed'): string {
  if (type === 'free' || amount === 0) return 'Free';
  const curr = currency || 'INR';
  const symbol =
    curr === 'INR'
      ? '₹'
      : curr === 'USD'
        ? '$'
        : curr === 'EUR'
          ? '€'
          : curr === 'GBP'
            ? '£'
            : `${curr} `;
  const formatted = typeof amount === 'number' ? amount.toLocaleString() : '0';
  if (type === 'starting_at') return `From ${symbol}${formatted}`;
  if (type === 'hourly') return `${symbol}${formatted}/hr`;
  return `${symbol}${formatted}`;
}

export function getInitials(name?: string, fallback = 'ST'): string {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function syntaxHighlight(json: string): string {
  if (!json) return '';
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      let cls = 'text-sky-400';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'text-pink-400';
        } else {
          cls = 'text-emerald-300';
        }
      } else if (/true|false/.test(match)) {
        cls = 'text-orange-400';
      } else if (/null/.test(match)) {
        cls = 'text-slate-500';
      }
      return `<span class="${cls}">${match}</span>`;
    },
  );
}
