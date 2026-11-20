import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { trace } from '@opentelemetry/api';
import { KnowledgeServiceClient } from '@repo/proto/knowledge';
import type { Request, Response } from 'express';
import { lastValueFrom } from 'rxjs';
import { RedisService } from '../services/redis.service.js';

@Injectable()
export class CorsOriginGuard implements CanActivate, OnModuleInit {
  private _knowledgeService!: KnowledgeServiceClient;

  constructor(
    @Inject('KNOWLEDGE_PACKAGE') private readonly _client: ClientGrpc,
    @Inject(RedisService) private readonly _redisService: RedisService,
  ) {}

  onModuleInit() {
    this._knowledgeService = this._client.getService<KnowledgeServiceClient>('KnowledgeService');
  }

  private normalizeHostname(originOrUrl: string): string {
    try {
      const url =
        originOrUrl.startsWith('http://') || originOrUrl.startsWith('https://')
          ? new URL(originOrUrl)
          : new URL(`https://${originOrUrl}`);
      return url.hostname.toLowerCase();
    } catch {
      return originOrUrl.toLowerCase().trim();
    }
  }

  private isDomainAllowed(requestHost: string, whitelistedDomains: string[]): boolean {
    const host = this.normalizeHostname(requestHost);

    
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
      return true;
    }

  
    const frontendUrl = process.env.FRONTEND_URL;
    if (frontendUrl && this.normalizeHostname(frontendUrl) === host) {
      return true;
    }

    if (whitelistedDomains.length === 0 || whitelistedDomains.includes('*')) {
      return true;
    }

    return whitelistedDomains.some((rawAllowed) => {
      const allowed = this.normalizeHostname(rawAllowed);
      if (allowed === host) return true;
      if (allowed.startsWith('*.')) {
        const root = allowed.slice(2);
        return host.endsWith(`.${root}`) || host === root;
      }
      return false;
    });
  }

  private async getWhitelistedDomains(tenantId: string, agentId: string): Promise<string[]> {
    const redisKey = `agent:${tenantId}:${agentId}:whitelist`;

    try {
      const redisCached = await this._redisService.get(redisKey);
      if (redisCached) {
        const parsed = JSON.parse(redisCached);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn(`[CorsOriginGuard] Redis lookup failed for ${redisKey}:`, err);
    }

    try {
      const response = await lastValueFrom(
        this._knowledgeService.getWidgetConfig({
          tenant_id: tenantId,
          agent_id: agentId,
          source: 'live',
        }),
      );

      let domains: string[] = [];
      if (response.widget_config_json) {
        try {
          const parsed = JSON.parse(response.widget_config_json);
          if (Array.isArray(parsed.whitelisted_domains)) {
            domains = parsed.whitelisted_domains.map((d: string) => String(d).trim().toLowerCase());
          }
        } catch {
          domains = [];
        }
      }

      await this._redisService.set(redisKey, JSON.stringify(domains), 300);
      return domains;
    } catch (err) {
      console.warn(
        `[CorsOriginGuard] Failed to fetch widget config via gRPC for ${redisKey}:`,
        err,
      );
      return [];
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, x-tenant-id, x-agent-id, Accept',
      );
      return true;
    }

    const rawOrigin =
      req.headers.origin || (req.headers.referer ? String(req.headers.referer) : undefined);
    if (!rawOrigin) {
      return true;
    }

    const tenantId = (req.body?.tenant_id || req.query?.tenant_id || req.headers['x-tenant-id']) as
      | string
      | undefined;
    const agentId = (req.body?.agent_id || req.query?.agent_id || req.headers['x-agent-id']) as
      | string
      | undefined;
    const activeSpan = trace.getActiveSpan();
    if (activeSpan) {
      if (tenantId) activeSpan.setAttribute('tenant.id', tenantId);
      if (agentId) activeSpan.setAttribute('agent.id', agentId);
    }

    if (!tenantId || !agentId) {
      return true;
    }

    const whitelistedDomains = await this.getWhitelistedDomains(tenantId, agentId);
    const allowed = this.isDomainAllowed(rawOrigin, whitelistedDomains);

    if (!allowed) {
      throw new ForbiddenException(
        `Website origin '${rawOrigin}' is not authorized for this agent. Please add this origin in your Schedulux Dashboard under Allowed Website Origins.`,
      );
    }

    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, x-tenant-id, x-agent-id, Accept',
    );

    return true;
  }
}
