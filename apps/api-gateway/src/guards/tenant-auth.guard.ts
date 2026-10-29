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

export interface AuthenticatedTenantRequest extends Request {
  tenant?: {
    tenant_id: string;
    email: string;
    role: string;
    [key: string]: unknown;
  };
  dashboardUser?: {
    user_id: string;
    tenant_id: string;
    email: string;
    role: string;
    system_role: string;
    [key: string]: unknown;
  };
}

interface DecodedToken {
  tenant_id?: string;
  user_id?: string;
  email?: string;
  role?: string;
  system_role?: string;
  [key: string]: unknown;
}

@Injectable()
export class TenantAuthGuard implements CanActivate {
  constructor(@Inject(ConfigService) private readonly _configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
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

      if (decoded.role === 'tenant_owner') {
        request.tenant = decoded as AuthenticatedTenantRequest['tenant'];
      } else if (
        decoded.role === 'root' ||
        decoded.role === 'manager' ||
        decoded.role === 'dashboard_user'
      ) {
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

