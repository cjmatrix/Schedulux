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

export interface AuthenticatedTenantRequest extends Request {
  tenant?: {
    tenant_id: string;
    email: string;
    role: string;
    [key: string]: any;
  };
  dashboardUser?: {
    user_id: string;
    tenant_id: string;
    email: string;
    role: string;
    system_role: string;
    [key: string]: any;
  };
}

@Injectable()
export class TenantAuthGuard implements CanActivate {
  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedTenantRequest>();
    const tenantToken = request.cookies?.access_token 
    const dashboardToken = request.cookies?.dashboarduser_access_token;
    
    const token = tenantToken || dashboardToken;

    if (!token) {
      throw new UnauthorizedException('Authentication token missing');
    }

    try {
      const secret =
        this.configService.get<string>('JWT_SECRET') || 'dev-secret-change-in-prod';

      const decoded = jwt.verify(token, secret) as any;

      if (!decoded || !decoded.tenant_id) {
        throw new UnauthorizedException('Invalid token structure');
      }

      if (decoded.role === 'tenant_owner') {
        request.tenant = decoded;
      } else if (decoded.role === 'root' || decoded.role === 'manager' || decoded.role === 'dashboard_user') {
        request.dashboardUser = decoded;
      } else {
       
        throw new UnauthorizedException('Unrecognized user role');
      }
      
      return true;
    } catch (err: any) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException('Invalid or expired authentication token');
    }
  }
}
