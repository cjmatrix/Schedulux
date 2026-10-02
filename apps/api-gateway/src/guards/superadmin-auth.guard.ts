import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedSuperAdminRequest extends Request {
  superAdmin?: {
    super_admin_id: string;
    email: string;
    name: string;
    role: string;
    [key: string]: any;
  };
}

@Injectable()
export class SuperAdminAuthGuard implements CanActivate {
  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedSuperAdminRequest>();
    const token = request.cookies?.superadmin_access_token;

    if (!token) {
      throw new UnauthorizedException('SuperAdmin authentication token missing');
    }

    try {
      const globalSecret = this.configService.get<string>('JWT_SECRET');
      const secret =
        this.configService.get<string>('SUPERADMIN_JWT_SECRET') ||
        (globalSecret ? `${globalSecret}_superadmin` : 'superadmin_access_secret_2025');

      const decoded = jwt.verify(token, secret) as any;

      if (!decoded || decoded.role !== 'super_admin') {
        throw new UnauthorizedException('Forbidden: SuperAdmin privileges required');
      }

      request.superAdmin = decoded;
      return true;
    } catch (err: any) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException('Invalid or expired superadmin authentication token');
    }
  }
}
