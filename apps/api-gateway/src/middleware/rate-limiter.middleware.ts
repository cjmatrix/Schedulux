import {
  HttpStatus,
  Injectable,
  Logger,
  NestMiddleware,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { COOKIE_NAMES } from '../constants/cookies.constant.js';
import { RedisService } from '../services/redis.service.js';

interface DecodedTokenSummary {
  tenant_id?: string;
  tier?: string;
  role?: string;
  [key: string]: unknown;
}

@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
  private readonly _logger = new Logger(RateLimiterMiddleware.name);

  constructor(private readonly _redisService: RedisService) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void | Response> {
  
    if (req.method === 'OPTIONS') {
      return next();
    }

    try {
     
      const tenantToken = req.cookies?.[COOKIE_NAMES.TENANT_ACCESS_TOKEN];
      const dashboardToken = req.cookies?.[COOKIE_NAMES.DASHBOARD_ACCESS_TOKEN];
      const authHeader = req.headers.authorization;
      const bearerToken = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7)
        : undefined;

      const token = tenantToken || dashboardToken || bearerToken;

      let tenantId: string | undefined;
      let tenantTier: string | undefined;

      if (token) {
        try {
          const decoded = jwt.decode(token) as DecodedTokenSummary | null;
          if (decoded && decoded.tenant_id) {
            tenantId = decoded.tenant_id;
            tenantTier = decoded.tier;
          }
        } catch {
      
        }
      }

      let rateLimitKey: string;
      let maxLimit: number;

      if (tenantId) {
     
        if (!tenantTier) {
          tenantTier = (await this._redisService.getTenantTier(tenantId)) || undefined;
        }

        const tierConfig = await this._redisService.getCachedTierConfig(tenantTier);
        maxLimit = tierConfig?.rate_limit_rpm || 60;
        rateLimitKey = `rate_limit:tenant:${tenantId}`;
      } else {
        // Public / Unauthenticated / IP-based
        const forwarded = req.headers['x-forwarded-for'];
        const ip =
          (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : undefined) ||
          req.ip ||
          req.socket.remoteAddress ||
          '127.0.0.1';

        maxLimit = 60; // 60 requests per minute for public endpoints
        rateLimitKey = `rate_limit:ip:${ip}`;
      }

      // 3. Evaluate rate limit in Redis (1-minute sliding window)
      const windowSeconds = 60;
      const result = await this._redisService.checkRateLimit(
        rateLimitKey,
        maxLimit,
        windowSeconds,
      );

      // 4. Populate standard RFC rate limit headers
      res.setHeader('X-RateLimit-Limit', maxLimit.toString());
      res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
      res.setHeader('X-RateLimit-Reset', result.resetTime.toString());

      // 5. Enforce 429 Too Many Requests if quota exceeded
      if (!result.allowed) {
        res.setHeader('Retry-After', result.resetTime.toString());
        return res.status(HttpStatus.TOO_MANY_REQUESTS).json({
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message: `Rate limit of ${maxLimit} requests per minute exceeded. Please try again in ${result.resetTime} seconds.`,
          retry_after: result.resetTime,
        });
      }

      return next();
    } catch (err) {
      this._logger.error('Error executing rate limiter middleware:', err);
      return next(); 
    }
  }
}

