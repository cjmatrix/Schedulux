import http from 'k6/http';
import { check, sleep } from 'k6';
import { CONFIG } from '../config.js';
import { generateHtmlReport, generateTextSummary } from '../utils/reporter.js';

export const options = {
  scenarios: {
    live_llm_benchmark: {
      executor: 'constant-vus',
      vus: 3,                 // Realistic 3 concurrent users to avoid external 429 throttling
      duration: '60s',        // 1-minute focused benchmark
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],         // Max 5% error tolerance under live WAN LLM
    http_req_duration: ['p(95)<4500'],       // 95% of full LangGraph + Qdrant + LLM cycles under 4.5s
    'http_req_duration{endpoint:live_chat}': ['p(95)<5000'],
  },
};

export default function () {
  const headers = { 'Content-Type': 'application/json' };

  // 1. Init Session
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
  });

  if (!initSuccess) {
    sleep(2);
    return;
  }

  const sessionData = JSON.parse(initRes.body).data;
  const sessionId = sessionData.session_id;
  const sessionToken = sessionData.token;

  // 2. Send Real Query (Hits live Voyage 4 embeddings, Qdrant hybrid search, and Gemini LLM)
  const prompt = CONFIG.CHAT_PROMPTS[__ITER % CONFIG.CHAT_PROMPTS.length];
  const chatUrl = `${CONFIG.CUSTOMER_GATEWAY_URL}/api/v1/public/chat`;
  const chatPayload = JSON.stringify({
    tenant_id: CONFIG.TENANT_ID,
    agent_id: CONFIG.AGENT_ID,
    session_id: sessionId,
    token: sessionToken,
    message: prompt,
    customer_name: `LiveTester-${__VU}`,
  });

  const chatRes = http.post(chatUrl, chatPayload, {
    headers: {
      ...headers,
      Authorization: `Bearer ${sessionToken}`,
    },
    tags: { endpoint: 'live_chat' },
  });

  check(chatRes, {
    'live chat status 200': (r) => r.status === 200,
    'has valid response': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Boolean(body.data && body.data.response && body.data.response.length > 10);
      } catch {
        return false;
      }
    },
  });

  sleep(2 + Math.random() * 2); // 2-4s realistic user reading time
}

export function handleSummary(data) {
  const title = 'Schedulux AI Gateway - Live LLM Benchmark';
  return {
    stdout: generateTextSummary(data, title),
    'loadtests/results/chat-live-smoke.html': generateHtmlReport(data, title),
    'loadtests/results/chat-live-smoke.json': JSON.stringify(data, null, 2),
  };
}
