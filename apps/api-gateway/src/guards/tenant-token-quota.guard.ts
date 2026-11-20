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
      req.tenant?.tenant_id || req.dashboardUser?.tenant_id || req.body?.tenant_id;

    if (!tenantId) {
      return true;
    }

    const tier =
      req.tenant?.tier || req.dashboardUser?.tier || req.body?.tier || 'starter';

    const tierConfig = await this._redisService.getCachedTierConfig(tier);
    const limit = tierConfig.weekly_token_limit ?? 100_000;

    if (limit === -1) {
      return true;
    }

    const currentUsage = await this._redisService.getWeeklyTokenUsage(tenantId);
    if (currentUsage >= limit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Weekly AI token quota exceeded (${currentUsage.toLocaleString()}/${limit.toLocaleString()} tokens used). Quota resets next week.`,
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}

