import * as crypto from 'crypto';

const CHAT_SESSION_SECRET =
  process.env.CHAT_SESSION_SECRET || 'schedulux-customer-chat-hmac-secret-key-32chars';

export function signSessionId(sessionId: string): string {
  const hmac = crypto.createHmac('sha256', CHAT_SESSION_SECRET);
  hmac.update(sessionId);
  const signature = hmac.digest('hex');
  return `${sessionId}.${signature}`;
}

export function verifySessionToken(token?: string | null): { valid: boolean; sessionId?: string } {
  if (!token || typeof token !== 'string') {
    return { valid: false };
  }

  const lastDotIndex = token.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return { valid: false };
  }

  const sessionId = token.substring(0, lastDotIndex);
  const signature = token.substring(lastDotIndex + 1);

  if (!sessionId || !signature) {
    return { valid: false };
  }

  try {
    const expectedHmac = crypto.createHmac('sha256', CHAT_SESSION_SECRET);
    expectedHmac.update(sessionId);
    const expectedSignature = expectedHmac.digest('hex');

    const sigBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (sigBuffer.length !== expectedBuffer.length) {
      return { valid: false };
    }

    if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return { valid: false };
    }

    return { valid: true, sessionId };
  } catch {
    return { valid: false };
  }
}

export function createSignedSession(prefix = 'sess'): { sessionId: string; token: string } {
  const randomPart = crypto.randomUUID();
  const sessionId = `${prefix}_${randomPart}`;
  const token = signSessionId(sessionId);
  return { sessionId, token };
}

