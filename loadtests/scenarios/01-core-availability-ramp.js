import http from 'k6/http';
import { check, sleep } from 'k6';
import { CONFIG } from '../config.js';
import { generateHtmlReport, generateTextSummary } from '../utils/reporter.js';

export const options = {
  scenarios: {
    availability_ramp: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 10 },   // Warm up baseline
        { duration: '90s', target: 50 },   // Ramp to moderate load
        { duration: '90s', target: 100 },  // Peak concurrent traffic
        { duration: '60s', target: 100 },  // Hold peak
        { duration: '30s', target: 0 },    // Graceful ramp down
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],         // Error rate must be under 1%
    http_req_duration: ['p(95)<3000'],      // 95% under 3.0s under peak 100-VU load over remote WAN database
    'http_req_duration{endpoint:availability}': ['p(95)<3000'],
  },
};

export default function () {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (CONFIG.TENANT_TOKEN) {
    headers['Authorization'] = `Bearer ${CONFIG.TENANT_TOKEN}`;
    headers['Cookie'] = `access_token=${CONFIG.TENANT_TOKEN}`;
  }

  // 1. Query Availability (Calculates in-memory slot intersections from PostgreSQL & Redis)
  const availUrl = `${CONFIG.CORE_GATEWAY_URL}/api/v1/tenant/scheduling/availability?service_id=${CONFIG.SERVICE_ID}&agent_id=${CONFIG.AGENT_ID}&start_date=2026-11-20&end_date=2026-11-25&timezone=UTC`;
  const availRes = http.get(availUrl, {
    headers,
    tags: { endpoint: 'availability' },
  });

  check(availRes, {
    'availability status 200': (r) => r.status === 200,
    'has slots data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data !== undefined;
      } catch {
        return false;
      }
    },
  });

  // 2. Query Services Catalog (High frequency lookup)
  const servicesUrl = `${CONFIG.CORE_GATEWAY_URL}/api/v1/tenant/scheduling/services`;
  const servRes = http.get(servicesUrl, {
    headers,
    tags: { endpoint: 'services' },
  });

  check(servRes, {
    'services status 200': (r) => r.status === 200,
  });

  sleep(0.5 + Math.random() * 0.5); // 500-1000ms think time between user actions
}

export function handleSummary(data) {
  const title = 'Schedulux Core Engine - Availability Ramp-Up';
  return {
    stdout: generateTextSummary(data, title),
    'loadtests/results/core-availability-ramp.html': generateHtmlReport(data, title),
    'loadtests/results/core-availability-ramp.json': JSON.stringify(data, null, 2),
  };
}
