/**
 * Schedulux Load Testing - Global Configuration & Constants
 */

export const CONFIG = {
  // Gateways
  CORE_GATEWAY_URL: __ENV.CORE_GATEWAY_URL || 'https://api.schedulux.xyz',
  CUSTOMER_GATEWAY_URL: __ENV.CUSTOMER_GATEWAY_URL || 'https://client-api.schedulux.xyz',

  // Tenant / Agent context
  TENANT_ID: __ENV.TENANT_ID || 'tnt_Qb012pyfTyZDwW1ctXTF6',
  AGENT_ID: __ENV.AGENT_ID || 'agent_bPZJykRSDsIdfbKC7rb15w',
  SERVICE_ID: __ENV.SERVICE_ID || 'srv_dental_checkup_cleaning',

  // Authentication
  // Generated via `node loadtests/utils/token.js` or passed via __ENV.TENANT_TOKEN
  TENANT_TOKEN: __ENV.TENANT_TOKEN || '',

  // Test Prompts for Customer Chat
  CHAT_PROMPTS: [
    'What is your condonation policy regarding PRP and breaks?',
    'Can I reschedule my appointment for next Tuesday?',
    'What dental services and checkups do you provide?',
    'How do I cancel my review session?',
    'Are personal breaks counted in the maximum duration?',
  ],
};
