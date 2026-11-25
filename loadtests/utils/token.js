/**
 * Schedulux Load Testing - Zero-Dependency JWT Token Generator
 * Generates an RFC-7519 compliant HMAC-SHA256 JWT for tenant-auth.guard.ts
 */

import crypto from 'node:crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-access-secret-key-change-in-production';
const TENANT_ID = process.env.TENANT_ID || 'tnt_Qb012pyfTyZDwW1ctXTF6';
const USER_ID = process.env.USER_ID || 'usr_loadtest_runner';
const ROLE = process.env.ROLE || 'tenant_owner';

function base64Url(input) {
  const buffer = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buffer
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export function generateTestTenantToken(tenantId = TENANT_ID, role = ROLE) {
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64Url(
    JSON.stringify({
      sub: USER_ID,
      user_id: USER_ID,
      tenant_id: tenantId,
      role: role,
      tier: 'enterprise',
      email: 'loadtest@schedulux.io',
      iat: now,
      exp: now + 7 * 24 * 3600,
    })
  );

  const signature = base64Url(
    crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest()
  );

  return `${header}.${payload}.${signature}`;
}

// Allow direct execution: `node loadtests/utils/token.js`
if (process.argv[1]?.endsWith('token.js')) {
  const token = generateTestTenantToken();
  console.log(token);
}
