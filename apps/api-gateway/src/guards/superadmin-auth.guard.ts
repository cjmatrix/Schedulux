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

export interface AuthenticatedSuperAdminRequest extends Request {
  superAdmin?: {
    super_admin_id: string;
    email: string;
    name: string;
    role: string;
    [key: string]: unknown;
  };
}

@Injectable()
export class SuperAdminAuthGuard implements CanActivate {
  constructor(@Inject(ConfigService) private readonly _configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedSuperAdminRequest>();
    const token = request.cookies?.[COOKIE_NAMES.SUPERADMIN_ACCESS_TOKEN];

    if (!token) {
      throw new UnauthorizedException(RESPONSE_MESSAGES.AUTH.SUPERADMIN_TOKEN_MISSING);
    }

    try {
      const globalSecret = this._configService.get<string>('JWT_SECRET');
      const secret =
        this._configService.get<string>('SUPERADMIN_JWT_SECRET') ||
        (globalSecret ? `${globalSecret}_superadmin` : 'superadmin_access_secret_2025');

      const decoded = jwt.verify(token, secret) as AuthenticatedSuperAdminRequest['superAdmin'];

      if (!decoded || decoded.role !== 'super_admin') {
        throw new UnauthorizedException(RESPONSE_MESSAGES.AUTH.SUPERADMIN_FORBIDDEN);
      }

      request.superAdmin = decoded;
      return true;
    } catch (err: unknown) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException(RESPONSE_MESSAGES.AUTH.INVALID_SUPERADMIN_TOKEN);
    }
  }
}

