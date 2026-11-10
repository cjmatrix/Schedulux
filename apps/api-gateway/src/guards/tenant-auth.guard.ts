import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { COOKIE_NAMES } from '../constants/cookies.constant.js';
import { RESPONSE_MESSAGES } from '../constants/messages.constant.js';
import { RedisService } from '../services/redis.service.js';

export interface AuthenticatedTenantRequest extends Request {
  tenant?: {
    tenant_id: string;
    email: string;
    role: string;
    tier?: string;
    [key: string]: unknown;
  };
  dashboardUser?: {
    user_id: string;
    tenant_id: string;
    agent_id?: string;
    email: string;
    role: string;
    system_role: string;
    tier?: string;
    [key: string]: unknown;
  };
}

interface DecodedToken {
  tenant_id?: string;
  agent_id?: string;
  user_id?: string;
  email?: string;
  role?: string;
  system_role?: string;
  tier?: string;
  [key: string]: unknown;
}

@Injectable()
export class TenantAuthGuard implements CanActivate {
  constructor(
    @Inject(ConfigService) private readonly _configService: ConfigService,
    @Inject(RedisService) private readonly _redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedTenantRequest>();
    const tenantToken = request.cookies?.[COOKIE_NAMES.TENANT_ACCESS_TOKEN];
    const dashboardToken = request.cookies?.[COOKIE_NAMES.DASHBOARD_ACCESS_TOKEN];

    const token = tenantToken || dashboardToken;

    if (!token) {
      throw new UnauthorizedException(RESPONSE_MESSAGES.AUTH.TOKEN_MISSING);
    }

    try {
      const secret = this._configService.get<string>('JWT_SECRET') || 'dev-secret-change-in-prod';

      const decoded = jwt.verify(token, secret) as DecodedToken;

      if (!decoded || !decoded.tenant_id) {
        throw new UnauthorizedException(RESPONSE_MESSAGES.AUTH.INVALID_TOKEN_STRUCTURE);
      }

      
      let tier = await this._redisService.getTenantTier(decoded.tenant_id);
      if (!tier) {
        tier = decoded.tier || 'starter';
        await this._redisService.setTenantTier(decoded.tenant_id, tier).catch(() => {});
      }
      decoded.tier = tier;

      if (decoded.role === 'tenant_owner') {
        request.tenant = decoded as AuthenticatedTenantRequest['tenant'];
      } else if (decoded.role === 'manager') {
        request.dashboardUser = decoded as AuthenticatedTenantRequest['dashboardUser'];
      } else {
        throw new UnauthorizedException(RESPONSE_MESSAGES.AUTH.UNRECOGNIZED_ROLE);
      }

      return true;
    } catch (err: unknown) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException(RESPONSE_MESSAGES.AUTH.INVALID_TOKEN);
    }
  }
}

