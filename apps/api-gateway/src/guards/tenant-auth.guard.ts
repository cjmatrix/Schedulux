import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientGrpc } from '@nestjs/microservices';
import { trace } from '@opentelemetry/api';
import { DashboardAuthServiceClient } from '@repo/proto/dashboard';
import { TenantServiceClient } from '@repo/proto/tenant';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { lastValueFrom } from 'rxjs';
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
    agent_ids?: string[];
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
  agent_ids?: string[];
  user_id?: string;
  email?: string;
  role?: string;
  system_role?: string;
  tier?: string;
  [key: string]: unknown;
}

@Injectable()
export class TenantAuthGuard implements CanActivate, OnModuleInit {
  private _tenantService!: TenantServiceClient;
  private _dashboardAuthService!: DashboardAuthServiceClient;

  constructor(
    @Inject(ConfigService) private readonly _configService: ConfigService,
    @Inject(RedisService) private readonly _redisService: RedisService,
    @Inject('TENANT_PACKAGE') private readonly _client: ClientGrpc,
    @Inject('DASHBOARD_PACKAGE') private readonly _dashboardClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this._tenantService = this._client.getService<TenantServiceClient>('TenantService');
    this._dashboardAuthService =
      this._dashboardClient.getService<DashboardAuthServiceClient>('DashboardAuthService');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedTenantRequest>();
    const tenantToken = request.cookies?.[COOKIE_NAMES.TENANT_ACCESS_TOKEN];
    const dashboardToken = request.cookies?.[COOKIE_NAMES.DASHBOARD_ACCESS_TOKEN];

    const isDashboardEndpoint = request.url?.includes('/dashboard-user/');

    const isTenantAuthEndpoint = request.url?.includes('/tenant/auth/');

    let token: string | undefined;
    if (isDashboardEndpoint) {
      token = dashboardToken;
    } else if (isTenantAuthEndpoint) {
      token = tenantToken;
    } else {
      token = tenantToken || dashboardToken;
    }

    if (!token) {
      throw new UnauthorizedException(RESPONSE_MESSAGES.AUTH.TOKEN_MISSING);
    }

    try {
      const secret = this._configService.get<string>('JWT_SECRET') || 'dev-secret-change-in-prod';

      const decoded = jwt.verify(token, secret) as DecodedToken;

      if (!decoded || !decoded.tenant_id) {
        throw new UnauthorizedException(RESPONSE_MESSAGES.AUTH.INVALID_TOKEN_STRUCTURE);
      }

      let status = await this._redisService.getTenantStatus(decoded.tenant_id);
      if (!status) {
        try {
          const tenantResp = await lastValueFrom(
            this._tenantService.getTenantById({
              tenant_id: decoded.tenant_id,
            }),
          );
          status = tenantResp?.tenant?.status || 'active';
          await this._redisService.setTenantStatus(decoded.tenant_id, status);
        } catch {
          status = 'active';
        }
      }

      if (status === 'suspended') {
        throw new ForbiddenException('Tenant account is suspended. Please contact support.');
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
        const userId = decoded.user_id || (decoded.sub as string);
        if (userId) {
          let userStatus = await this._redisService.getDashboardUserStatus(userId);
          if (!userStatus) {
            try {
              const profile = await lastValueFrom(
                this._dashboardAuthService.getProfile({ user_id: userId }),
              );
              userStatus = profile?.user?.status || 'active';
              await this._redisService.setDashboardUserStatus(userId, userStatus);
            } catch {
              userStatus = 'active';
            }
          }

          if (userStatus === 'suspended') {
            throw new ForbiddenException(
              'Your account has been suspended. Please contact your workspace administrator.',
            );
          }
        }
        request.dashboardUser = decoded as AuthenticatedTenantRequest['dashboardUser'];
      } else {
        throw new UnauthorizedException(RESPONSE_MESSAGES.AUTH.UNRECOGNIZED_ROLE);
      }

      const activeSpan = trace.getActiveSpan();
      if (activeSpan) {
        if (decoded.tenant_id) activeSpan.setAttribute('tenant.id', decoded.tenant_id);
        if (decoded.tier) activeSpan.setAttribute('tenant.tier', decoded.tier);
        if (decoded.role) activeSpan.setAttribute('tenant.role', decoded.role);
        if (decoded.user_id || decoded.sub) {
          activeSpan.setAttribute('user.id', (decoded.user_id || decoded.sub) as string);
        }
        if (decoded.agent_id) activeSpan.setAttribute('agent.id', decoded.agent_id);

        const sessionId = (request.body?.session_id ||
          request.query?.session_id ||
          request.headers?.['x-session-id']) as string | undefined;
        if (sessionId) {
          activeSpan.setAttribute('session.id', sessionId);
          if (sessionId.startsWith('sandbox_')) {
            activeSpan.setAttribute('session.is_sandbox', true);
          }
        }
      }

      return true;
    } catch (err: unknown) {
      if (err instanceof UnauthorizedException || err instanceof ForbiddenException) {
        throw err;
      }
      throw new UnauthorizedException(RESPONSE_MESSAGES.AUTH.INVALID_TOKEN);
    }
  }
}
