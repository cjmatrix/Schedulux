import http from 'k6/http';
import { check, sleep } from 'k6';
import { CONFIG } from '../config.js';
import { generateHtmlReport, generateTextSummary } from '../utils/reporter.js';

export const options = {
  scenarios: {
    customer_chat_ramp: {
      executor: 'ramping-vus',
      startVUs: 2,
      stages: [
        { duration: '30s', target: 10 },   // Warm up
        { duration: '90s', target: 50 },   // Moderate concurrency
        { duration: '90s', target: 100 },  // Peak 100 concurrent customers chatting
        { duration: '60s', target: 100 },  // Hold peak
        { duration: '30s', target: 0 },    // Ramp down
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],         // Less than 1% failure
    http_req_duration: ['p(95)<1500'],      // P95 under 1.5s across remote WAN cloud databases
    'http_req_duration{endpoint:chat_message}': ['p(95)<1500'],
    'http_req_duration{endpoint:chat_init}': ['p(95)<800'],
  },
};

// VU-isolated conversational state
let currentSessionId = null;
let currentSessionToken = null;
let messagesInSession = 0;

export default function () {
  const headers = { 'Content-Type': 'application/json' };

  // 1. Initialize or rotate session every 5 conversational turns
  if (!currentSessionId || !currentSessionToken || messagesInSession >= 5) {
    const initUrl = `${CONFIG.CUSTOMER_GATEWAY_URL}/api/v1/public/chat/init`;
    const initPayload = JSON.stringify({
      tenant_id: CONFIG.TENANT_ID,
      agent_id: CONFIG.AGENT_ID,
    });

    const initRes = http.post(initUrl, initPayload, {
      headers,
      tags: { endpoint: 'chat_init' },
    });

    const initSuccess = check(initRes, {
      'chat init 200': (r) => r.status === 200,
      'has session_id & token': (r) => {
        try {
          const d = JSON.parse(r.body).data;
          return Boolean(d && d.session_id && d.token);
        } catch {
          return false;
        }
      },
    });

    if (!initSuccess) {
      sleep(0.5);
      return;
    }

    const sessionData = JSON.parse(initRes.body).data;
    currentSessionId = sessionData.session_id;
    currentSessionToken = sessionData.token;
    messagesInSession = 0;

    // Fetch Widget Config once per session
    const configUrl = `${CONFIG.CUSTOMER_GATEWAY_URL}/api/v1/public/chat/config?tenant_id=${CONFIG.TENANT_ID}&agent_id=${CONFIG.AGENT_ID}`;
    const configRes = http.get(configUrl, {
      headers,
      tags: { endpoint: 'chat_config' },
    });

    check(configRes, {
      'chat config 200': (r) => r.status === 200,
    });
  }

  // 2. Post Chat Message (Reusing active customer session)
  const prompt = CONFIG.CHAT_PROMPTS[__ITER % CONFIG.CHAT_PROMPTS.length];
  const chatUrl = `${CONFIG.CUSTOMER_GATEWAY_URL}/api/v1/public/chat`;
  const chatPayload = JSON.stringify({
    tenant_id: CONFIG.TENANT_ID,
    agent_id: CONFIG.AGENT_ID,
    session_id: currentSessionId,
    token: currentSessionToken,
    message: prompt,
    customer_name: `Customer VU-${__VU}`,
  });

  const chatRes = http.post(chatUrl, chatPayload, {
    headers: {
      ...headers,
      Authorization: `Bearer ${currentSessionToken}`,
    },
    tags: { endpoint: 'chat_message' },
  });

  check(chatRes, {
    'chat message 200': (r) => r.status === 200,
    'has agent response': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Boolean(body.data && body.data.response);
      } catch {
        return false;
      }
    },
  });

  messagesInSession++;
  sleep(0.3 + Math.random() * 0.4);
}

export function handleSummary(data) {
  const title = 'Schedulux AI Gateway - Customer Chat Ramp-Up';
  return {
    stdout: generateTextSummary(data, title),
    'loadtests/results/chat-mocked-ramp.html': generateHtmlReport(data, title),
    'loadtests/results/chat-mocked-ramp.json': JSON.stringify(data, null, 2),
  };
}
