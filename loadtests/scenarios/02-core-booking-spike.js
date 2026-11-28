import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';
import { CONFIG } from '../config.js';
import { generateHtmlReport, generateTextSummary } from '../utils/reporter.js';

// Custom metrics to distinguish business concurrency conflicts (409) from true system crashes (5xx)
const successfulBookings = new Counter('successful_bookings');
const concurrencyConflicts = new Counter('concurrency_conflicts');
const systemErrors = new Rate('system_errors');

export const options = {
  scenarios: {
    booking_spike: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '20s', target: 10 },   // Normal baseline traffic
        { duration: '10s', target: 100 },  // Sudden 10x traffic spike!
        { duration: '60s', target: 100 },  // Sustained burst stress
        { duration: '10s', target: 10 },   // Rapid recovery
        { duration: '20s', target: 10 },   // Post-spike baseline
      ],
      gracefulRampDown: '5s',
    },
  },
  thresholds: {
    system_errors: ['rate<0.01'],          // Under 1% 5xx server errors
    http_req_duration: ['p(95)<2500'],     // 95% under 2500ms during peak spike over remote WAN database
    'http_req_duration{endpoint:booking_write}': ['p(95)<2500'],
  },
};

/**
 * Lifecycle Hook: setup() runs ONCE before all VUs start.
 * Dynamically discovers the tenant's active service catalog from the database.
 */
export function setup() {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (CONFIG.TENANT_TOKEN) {
    headers['Authorization'] = `Bearer ${CONFIG.TENANT_TOKEN}`;
    headers['Cookie'] = `access_token=${CONFIG.TENANT_TOKEN}`;
  }

  const servicesUrl = `${CONFIG.CORE_GATEWAY_URL}/api/v1/tenant/scheduling/services?agent_id=${CONFIG.AGENT_ID}&limit=50`;
  const res = http.get(servicesUrl, { headers });

  let services = [];
  try {
    const body = JSON.parse(res.body);
    if (body.data && Array.isArray(body.data)) {
      services = body.data
        .filter((s) => !s.is_deleted && (s.booking_mode === 'time_slot' || !s.booking_mode))
        .map((s) => ({
          service_id: s.service_id,
          agent_id: s.agent_id || CONFIG.AGENT_ID,
          name: s.name,
        }));
    }
  } catch (err) {
    console.warn('[setup] Failed to parse services catalog, using fallback:', err);
  }

  if (services.length === 0) {
    services = [
      {
        service_id: CONFIG.SERVICE_ID,
        agent_id: CONFIG.AGENT_ID,
        name: 'Default Service',
      },
    ];
  }

  console.log(`[setup] Discovered ${services.length} active services for tenant load distribution.`);
  return { services };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (CONFIG.TENANT_TOKEN) {
    headers['Authorization'] = `Bearer ${CONFIG.TENANT_TOKEN}`;
    headers['Cookie'] = `access_token=${CONFIG.TENANT_TOKEN}`;
  }

  // 1. Distribute VUs across discovered services (Round-robin by VU ID + Iteration)
  const services = data?.services?.length ? data.services : [
    {
      service_id: CONFIG.SERVICE_ID,
      agent_id: CONFIG.AGENT_ID,
      name: 'Default Service',
    },
  ];
  const targetService = services[(__VU + __ITER) % services.length];

  // Dynamic date range (tomorrow to +5 days)
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const endRange = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];

  // 2. Fetch live slot availability for this service & agent
  const availUrl = `${CONFIG.CORE_GATEWAY_URL}/api/v1/tenant/scheduling/availability?service_id=${targetService.service_id}&agent_id=${targetService.agent_id}&start_date=${tomorrow}&end_date=${endRange}&timezone=UTC`;
  const availRes = http.get(availUrl, {
    headers,
    tags: { endpoint: 'availability' },
  });

  check(availRes, {
    'availability status 200': (r) => r.status === 200,
  });

  // Extract real available slots
  let selectedSlotTime = null;
  try {
    const availBody = JSON.parse(availRes.body);
    const days = availBody.data?.days || [];
    const openSlots = [];
    for (const day of days) {
      if (day.slots) {
        for (const slot of day.slots) {
          if (slot.available && slot.start_time) {
            openSlots.push(slot.start_time);
          }
        }
      }
    }
    if (openSlots.length > 0) {
      // Pick an open slot, distributed by VU ID
      selectedSlotTime = openSlots[(__VU * 3 + __ITER) % openSlots.length];
    }
  } catch {}

  // Fallback to random offset if availability had no open slots
  if (!selectedSlotTime) {
    const randomMinutes = Math.floor(Math.random() * 32) * 15;
    selectedSlotTime = new Date(Date.now() + 86400000 + randomMinutes * 60000).toISOString();
  }

  // 3. High-concurrency booking reservation (Pure-write transaction + Outbox event)
  const bookingUrl = `${CONFIG.CORE_GATEWAY_URL}/api/v1/tenant/scheduling/bookings`;
  const payload = JSON.stringify({
    agent_id: targetService.agent_id,
    service_id: targetService.service_id,
    start_time: selectedSlotTime,
    customer_name: `VU-${__VU} LoadTest`,
    customer_email: `vu-${__VU}-${Date.now()}@test.io`,
    customer_phone: `+1555${Math.floor(1000000 + Math.random() * 9000000)}`,
    notes: `Load testing spike - ${targetService.name}`,
    source: 'manual',
  });

  const bookRes = http.post(bookingUrl, payload, {
    headers,
    tags: { endpoint: 'booking_write' },
  });

  // Track metrics
  if (bookRes.status === 201 || bookRes.status === 200) {
    successfulBookings.add(1);
    systemErrors.add(false);
  } else if (bookRes.status === 409) {
    concurrencyConflicts.add(1);
    systemErrors.add(false); // 409 Conflict is expected concurrency rejection, not a server fault
  } else {
    systemErrors.add(true); // 400, 500, 502, 503, 504 are actual system errors
  }

  check(bookRes, {
    'booking resolved (201 Created or 409 Conflict)': (r) =>
      r.status === 201 || r.status === 200 || r.status === 409,
    'no 5xx server errors': (r) => r.status < 500,
  });

  sleep(0.3 + Math.random() * 0.4);
}

export function handleSummary(data) {
  const title = 'Schedulux Core Engine - Booking Spike Test';
  return {
    stdout: generateTextSummary(data, title),
    'loadtests/results/core-booking-spike.html': generateHtmlReport(data, title),
    'loadtests/results/core-booking-spike.json': JSON.stringify(data, null, 2),
  };
}
