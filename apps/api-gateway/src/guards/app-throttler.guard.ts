import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  ThrottlerGuard,
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from '@nestjs/throttler';
import jwt from 'jsonwebtoken';
import { COOKIE_NAMES } from '../constants/cookies.constant.js';

interface DecodedTokenSummary {
  tenant_id?: string;
  tier?: string;
  role?: string;
  [key: string]: unknown;
}

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions() options: ThrottlerModuleOptions,
    @InjectThrottlerStorage() storageService: ThrottlerStorage,
    reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }

  protected override async shouldSkip(context: ExecutionContext): Promise<boolean> {
    if (process.env.RATE_LIMIT_DISABLED === 'true' || process.env.LOADTEST_MODE === 'true') {
      return true;
    }

    if (context.getType() !== 'http') {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    if (req?.method === 'OPTIONS') {
      return true;
    }

    return super.shouldSkip(context);
  }

  protected override async getTracker(req: Record<string, any>): Promise<string> {
    if (req.tenant?.tenant_id) {
      return `tenant:${req.tenant.tenant_id}`;
    }
    if (req.dashboardUser?.tenant_id) {
      return `tenant:${req.dashboardUser.tenant_id}`;
    }

    const tenantToken = req.cookies?.[COOKIE_NAMES.TENANT_ACCESS_TOKEN];
    const dashboardToken = req.cookies?.[COOKIE_NAMES.DASHBOARD_ACCESS_TOKEN];
    const authHeader = req.headers?.authorization;
    const bearerToken =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : undefined;

    const token = tenantToken || dashboardToken || bearerToken;
    if (token) {
      try {
        const decoded = jwt.decode(token) as DecodedTokenSummary | null;
        if (decoded?.tenant_id) {
          return `tenant:${decoded.tenant_id}`;
        }
      } catch {}
    }

    const forwarded = req.headers?.['x-forwarded-for'];
    const ip =
      (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : undefined) ||
      req.ip ||
      req.socket?.remoteAddress ||
      '127.0.0.1';

    return `ip:${ip}`;
  }
}
