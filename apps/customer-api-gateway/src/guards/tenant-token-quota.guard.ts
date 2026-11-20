import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { RedisService } from '../services/redis.service.js';

@Injectable()
export class TenantTokenQuotaGuard implements CanActivate {
  constructor(@Inject(RedisService) private readonly _redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const tenantId =
      req.body?.tenant_id || req.query?.tenant_id || req.headers?.['x-tenant-id'];

    if (!tenantId) {
      return true;
    }

    const [tier, currentUsage] = await Promise.all([
      this._redisService.getTenantTier(tenantId),
      this._redisService.getWeeklyTokenUsage(tenantId),
    ]);
    const tierConfig = await this._redisService.getCachedTierConfig(tier);
    const limit = tierConfig.weekly_token_limit ?? 100_000;

    if (limit === -1) {
      req.verifiedTier = tier;
      return true;
    }

    if (currentUsage >= limit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message:
            'The AI assistant is temporarily unavailable because this organization has reached its weekly usage limit. Please contact support.',
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    req.verifiedTier = tier;
    return true;
  }
}

