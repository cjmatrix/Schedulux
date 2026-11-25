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
export class CrawlQuotaGuard implements CanActivate {
  constructor(@Inject(RedisService) private readonly _redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const tenantId = req.tenant?.tenant_id || req.dashboardUser?.tenant_id;

    if (!tenantId) {
      return true;
    }

    const tenantTier = req.tenant?.tier || req.dashboardUser?.tier || 'starter';

    const activeJobId = await this._redisService.getActiveCrawlJob(tenantId);
    if (activeJobId) {
      throw new HttpException(
        {
          statusCode: HttpStatus.CONFLICT,
          message: `A website crawl is currently in progress for your workspace (Job ID: ${activeJobId}). Please wait for it to complete.`,
          error: 'Conflict',
        },
        HttpStatus.CONFLICT,
      );
    }

    const tierConfig = await this._redisService.getCachedTierConfig(tenantTier);
    const weeklyLimit =
      tierConfig.weekly_crawl_limit ?? (tenantTier.toLowerCase() === 'enterprise' ? -1 : 5);

    if (weeklyLimit !== -1) {
      const currentUsage = await this._redisService.getWeeklyCrawlUsage(tenantId);
      if (currentUsage >= weeklyLimit) {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: `Weekly website crawl quota exceeded (${currentUsage}/${weeklyLimit} crawls used). Quota resets next week.`,
            error: 'Too Many Requests',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    req.crawlQuota = {
      tenantId,
      tenantTier,
      weeklyLimit,
    };

    return true;
  }
}
