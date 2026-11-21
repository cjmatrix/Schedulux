import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { trace } from '@opentelemetry/api';
import type { Request } from 'express';
import { RESPONSE_MESSAGES } from '../constants/messages.constant.js';
import { verifySessionToken } from '../utils/session-token.util.js';

export interface VerifiedCustomerSession {
  sessionId: string;
  token?: string;
  tenantId?: string;
  agentId?: string;
}

declare global {
  namespace Express {
    interface Request {
      customerSession?: VerifiedCustomerSession;
    }
  }
}

@Injectable()
export class CustomerSessionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();

    if (req.method === 'OPTIONS') {
      return true;
    }

    const authHeader = req.headers.authorization;
    const token =
      (authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined) ||
      (req.body?.token as string | undefined) ||
      (req.query?.token as string | undefined);

    const rawSessionId = req.body?.session_id as string | undefined;
    const tenantId = req.body?.tenant_id as string | undefined;
    const agentId = req.body?.agent_id as string | undefined;

    if (rawSessionId?.startsWith('sandbox_')) {
      throw new BadRequestException('Sandbox sessions are not allowed in public live chat.');
    }

    let resolvedSessionId: string | undefined;
    let resolvedTenantId = tenantId;
    let resolvedAgentId = agentId;

    if (token) {
      const verified = verifySessionToken(token, {
        expectedTenantId: tenantId,
        expectedAgentId: agentId,
      });

      if (!verified.valid || !verified.sessionId) {
        throw new UnauthorizedException(RESPONSE_MESSAGES.CHAT.INVALID_SESSION_TOKEN);
      }

      if (verified.sessionId.startsWith('sandbox_')) {
        throw new BadRequestException('Sandbox sessions are not allowed in public live chat.');
      }

      resolvedSessionId = verified.sessionId;
      if (verified.tenantId) {
        resolvedTenantId = verified.tenantId;
        if (req.body) req.body.tenant_id = verified.tenantId;
      }
      if (verified.agentId) {
        resolvedAgentId = verified.agentId;
        if (req.body) req.body.agent_id = verified.agentId;
      }
    } else if (rawSessionId) {
      resolvedSessionId = rawSessionId;
    }

    if (resolvedSessionId) {
      req.customerSession = {
        sessionId: resolvedSessionId,
        token,
        tenantId: resolvedTenantId,
        agentId: resolvedAgentId,
      };

      const activeSpan = trace.getActiveSpan();
      if (activeSpan) {
        if (resolvedTenantId) activeSpan.setAttribute('tenant.id', resolvedTenantId);
        if (resolvedAgentId) activeSpan.setAttribute('agent.id', resolvedAgentId);
        activeSpan.setAttribute('session.id', resolvedSessionId);
      }
    }

    return true;
  }
}
