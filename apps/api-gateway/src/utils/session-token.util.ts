import * as crypto from 'crypto';
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';

const CHAT_SESSION_SECRET =
  process.env.CHAT_SESSION_SECRET || 'schedulux-customer-chat-hmac-secret-key-32chars';

const DEFAULT_SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

export interface SessionTokenPayload {
  sessionId: string;
  tenantId?: string;
  agentId?: string;
  expiresInSeconds?: number;
}

export interface VerifySessionOptions {
  expectedTenantId?: string;
  expectedAgentId?: string;
}

export interface VerifySessionResult {
  valid: boolean;
  sessionId?: string;
  tenantId?: string;
  agentId?: string;
  error?: string;
}

export function signSessionToken(payload: SessionTokenPayload): string {
  const claims: Record<string, any> = {
    sid: payload.sessionId,
  };
  if (payload.tenantId) claims.tid = payload.tenantId;
  if (payload.agentId) claims.aid = payload.agentId;

  const options: SignOptions = {
    expiresIn: payload.expiresInSeconds ?? DEFAULT_SESSION_TTL_SECONDS,
    algorithm: 'HS256',
  };

  return jwt.sign(claims, CHAT_SESSION_SECRET, options);
}

export function signSessionId(
  sessionId: string,
  tenantId?: string,
  agentId?: string,
  expiresInSeconds?: number,
): string {
  return signSessionToken({
    sessionId,
    tenantId,
    agentId,
    expiresInSeconds,
  });
}

export function verifySessionToken(
  token?: string | null,
  options?: VerifySessionOptions,
): VerifySessionResult {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Empty token' };
  }

  try {
    const decoded = jwt.verify(token, CHAT_SESSION_SECRET, {
      algorithms: ['HS256'],
    }) as JwtPayload;

    const sessionId: string | undefined = decoded.sid;
    const tenantId: string | undefined = decoded.tid;
    const agentId: string | undefined = decoded.aid;

    if (!sessionId) {
      return { valid: false, error: 'Missing session ID in token' };
    }

    if (options?.expectedTenantId && tenantId && options.expectedTenantId !== tenantId) {
      return { valid: false, error: 'Tenant ID mismatch' };
    }

    if (options?.expectedAgentId && agentId && options.expectedAgentId !== agentId) {
      return { valid: false, error: 'Agent ID mismatch' };
    }

    return {
      valid: true,
      sessionId,
      tenantId,
      agentId,
    };
  } catch (err: any) {
    return { valid: false, error: err?.message || 'Invalid token' };
  }
}

export function createSignedSession(
  prefix = 'sess',
  tenantId?: string,
  agentId?: string,
  expiresInSeconds?: number,
): { sessionId: string; token: string } {
  const randomPart = crypto.randomUUID();
  const sessionId = `${prefix}_${randomPart}`;
  const token = signSessionToken({
    sessionId,
    tenantId,
    agentId,
    expiresInSeconds,
  });
  return { sessionId, token };
}
