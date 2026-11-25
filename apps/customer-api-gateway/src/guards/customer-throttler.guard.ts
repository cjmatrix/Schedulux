import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  ThrottlerGuard,
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from '@nestjs/throttler';

@Injectable()
export class CustomerThrottlerGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions() options: ThrottlerModuleOptions,
    @InjectThrottlerStorage() storageService: ThrottlerStorage,
    reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }

  protected override async shouldSkip(context: ExecutionContext): Promise<boolean> {
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
    const tenantId = req.body?.tenant_id || req.query?.tenant_id || req.headers?.['x-tenant-id'];

    if (tenantId && typeof tenantId === 'string' && tenantId.trim().length > 0) {
      return `tenant:${tenantId.trim()}`;
    }

    const forwarded = req.headers?.['x-forwarded-for'];
    const ip =
      (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : undefined) ||
      req.ip ||
      req.socket?.remoteAddress ||
      '127.0.0.1';

    return `ip:${ip}`;
  }

  protected override generateKey(
    context: ExecutionContext,
    trackerString: string,
    throttlerName: string,
  ): string {
    return `${throttlerName}:${trackerString}`;
  }
}
