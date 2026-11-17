import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { DEFAULT_TIER, STATIC_TIER_CONFIGS, TierConfig } from '../constants/tiers.constant.js';
import {
  ISchemaCacheService,
  ISchemaEventSubscriber,
  SchemaGeneratedEvent,
} from '../interfaces/ISchemaEventSubscriber.js';

export { SchemaGeneratedEvent };

@Injectable()
export class RedisService
  implements ISchemaEventSubscriber, ISchemaCacheService, OnModuleInit, OnModuleDestroy
{
  private readonly _logger = new Logger(RedisService.name);
  private _client!: Redis;
  private _subscriber!: Redis;
  private readonly _eventHandlers: ((event: SchemaGeneratedEvent) => void)[] = [];

  constructor(
    @Inject(ConfigService)
    private readonly _configService: ConfigService,
  ) {}

  onModuleInit() {
    const redisUri =
      this._configService.get<string>('REDIS_URI') || process.env.REDIS_URI;
    const redisHost =
      this._configService.get<string>('REDIS_HOST') || process.env.REDIS_HOST || 'localhost';
    const redisPort = Number(
      this._configService.get<number>('REDIS_PORT') || process.env.REDIS_PORT || 6379,
    );

    if (redisUri) {
      this._logger.log(`Connecting to Redis via URI: ${redisUri}`);
      this._client = new Redis(redisUri);
      this._subscriber = new Redis(redisUri);
    } else {
      this._logger.log(`Connecting to Redis: ${redisHost}:${redisPort}`);
      this._client = new Redis({ host: redisHost, port: redisPort });
      this._subscriber = new Redis({ host: redisHost, port: redisPort });
    }

    const channel = 'schema-generation-events';
    this._subscriber.subscribe(channel, (err) => {
      if (err) {
        this._logger.error(`Failed to subscribe to ${channel} channel`, err);
      } else {
        this._logger.log(`Subscribed to Redis channel: ${channel}`);
      }
    });

    this._subscriber.on('message', (receivedChannel, message) => {
      if (receivedChannel === channel) {
        try {
          const parsed: SchemaGeneratedEvent = JSON.parse(message);
          this._logger.log(
            `Received schema event for tenant ${parsed.tenant_id}, job ${parsed.job_id}`,
          );
          for (const handler of this._eventHandlers) {
            handler(parsed);
          }
        } catch (e) {
          this._logger.error('Error parsing Redis Pub/Sub message', e);
        }
      }
    });
  }

  onSchemaGenerated(callback: (event: SchemaGeneratedEvent) => void): void {
    this._eventHandlers.push(callback);
  }

  async getDraftSchema(tenantId: string, jobId?: string): Promise<Record<string, unknown> | null> {
    const key = jobId ? `agent:draft:${tenantId}:${jobId}` : `agent:draft:${tenantId}`;
    try {
      const raw = await this._client.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as Record<string, unknown>;
    } catch (err) {
      this._logger.error(`Failed to retrieve draft schema for key: ${key}`, err);
      return null;
    }
  }

  getClient(): Redis {
    return this._client;
  }


  async checkRateLimit(
    key: string,
    limit: number,
    windowSeconds = 60,
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number; total: number }> {
    if (!this._client) {
      return { allowed: true, remaining: limit, resetTime: windowSeconds, total: 1 };
    }

    const script = `
      local current = redis.call('INCR', KEYS[1])
      if current == 1 then
        redis.call('EXPIRE', KEYS[1], ARGV[1])
      end
      local ttl = redis.call('TTL', KEYS[1])
      return {current, ttl}
    `;

    try {
      const res = (await this._client.eval(script, 1, key, windowSeconds)) as [number, number];
      const total = Number(res[0]);
      const ttl = Number(res[1]) > 0 ? Number(res[1]) : windowSeconds;

      const allowed = total <= limit;
      const remaining = Math.max(0, limit - total);

      return {
        allowed,
        remaining,
        resetTime: ttl,
        total,
      };
    } catch (err) {
      this._logger.warn(`Redis rate limit evaluation error for key ${key}, failing open:`, err);
      return { allowed: true, remaining: 1, resetTime: windowSeconds, total: 1 };
    }
  }

  async getTenantTier(tenantId: string): Promise<string | null> {
    try {
      return await this._client.get(`tenant:${tenantId}:tier`);
    } catch (err) {
      this._logger.error(`Failed to get cached tenant tier for ${tenantId}:`, err);
      return null;
    }
  }

  async setTenantTier(tenantId: string, tier: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds && ttlSeconds > 0) {
        await this._client.set(`tenant:${tenantId}:tier`, tier, 'EX', ttlSeconds);
      } else {
        await this._client.set(`tenant:${tenantId}:tier`, tier);
      }
    } catch (err) {
      this._logger.error(`Failed to cache tenant tier for ${tenantId}:`, err);
    }
  }

  async getCachedTierConfig(tier?: string | null): Promise<TierConfig> {
    const normalized = (tier || DEFAULT_TIER).trim().toLowerCase();
    const fallback = STATIC_TIER_CONFIGS[normalized] || STATIC_TIER_CONFIGS[DEFAULT_TIER];

    if (!this._client) return fallback;

    try {
      const raw = await this._client.get(`tier_config:${normalized}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          tier: String(parsed.tier || normalized),
          name: String(parsed.name || fallback.name),
          max_agents: Number(parsed.max_agents ?? fallback.max_agents),
          max_services: Number(parsed.max_services ?? fallback.max_services),
          max_resources: Number(parsed.max_resources ?? fallback.max_resources),
          max_kb_docs: Number(parsed.max_kb_docs ?? fallback.max_kb_docs),
          max_kb_doc_size_mb: Number(parsed.max_kb_doc_size_mb ?? fallback.max_kb_doc_size_mb),
          weekly_token_limit: Number(parsed.weekly_token_limit ?? fallback.weekly_token_limit),
          rate_limit_rpm: Number(parsed.rate_limit_rpm ?? fallback.rate_limit_rpm),
          weekly_crawl_limit: Number(
            parsed.weekly_crawl_limit ??
              fallback.weekly_crawl_limit ??
              (normalized === 'enterprise' ? -1 : 5),
          ),
          status: (parsed.status || fallback.status) as TierConfig['status'],
          description: parsed.description || fallback.description,
        };
      }
    } catch (err) {
      this._logger.warn(`Failed to read tier_config:${normalized} from Redis, using fallback:`, err);
    }
    return fallback;
  }

  async getCachedAllTierConfigs(): Promise<Record<string, TierConfig>> {
    const fallback = { ...STATIC_TIER_CONFIGS };
    if (!this._client) return fallback;

    try {
      const raw = await this._client.get('tier_config:all');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const result: Record<string, TierConfig> = {};
          for (const item of parsed) {
            result[item.tier] = {
              tier: item.tier,
              name: item.name,
              max_agents: Number(item.max_agents),
              max_services: Number(item.max_services),
              max_resources: Number(item.max_resources),
              max_kb_docs: Number(item.max_kb_docs),
              max_kb_doc_size_mb: Number(item.max_kb_doc_size_mb),
              weekly_token_limit: Number(item.weekly_token_limit),
              rate_limit_rpm: Number(item.rate_limit_rpm),
              weekly_crawl_limit: Number(
                item.weekly_crawl_limit ?? (item.tier === 'enterprise' ? -1 : 5),
              ),
              status: item.status,
              description: item.description,
            };
          }
          return result;
        }
        if (typeof parsed === 'object' && parsed !== null) {
          return parsed as Record<string, TierConfig>;
        }
      }
    } catch (err) {
      this._logger.warn('Failed to read tier_config:all from Redis, using fallback:', err);
    }
    return fallback;
  }

  async invalidateTierConfigCache(tier?: string): Promise<void> {
    if (!this._client) return;
    try {
      const keys = ['tier_config:all'];
      if (tier) {
        keys.push(`tier_config:${tier.trim().toLowerCase()}`);
      }
      await this._client.del(...keys);
    } catch (err) {
      this._logger.error('Failed to invalidate tier config cache in Redis:', err);
    }
  }

  async setCachedTierConfig(
    tier: string,
    config: TierConfig | Record<string, unknown>,
  ): Promise<void> {
    if (!this._client) return;
    try {
      const normalized = tier.trim().toLowerCase();
      await this._client.set(`tier_config:${normalized}`, JSON.stringify(config));
      await this._client.del('tier_config:all');
    } catch (err) {
      this._logger.error(`Failed to cache tier_config:${tier} in Redis:`, err);
    }
  }

  async getTenantStatus(tenantId: string): Promise<string | null> {
    try {
      return await this._client.get(`tenant:${tenantId}:status`);
    } catch (err) {
      this._logger.error(`Failed to get cached tenant status for ${tenantId}:`, err);
      return null;
    }
  }

  async setTenantStatus(tenantId: string, status: string, ttlSeconds = 86400 * 30): Promise<void> {
    try {
      await this._client.set(`tenant:${tenantId}:status`, status, 'EX', ttlSeconds);
    } catch (err) {
      this._logger.error(`Failed to cache tenant status for ${tenantId}:`, err);
    }
  }

  async getDashboardUserStatus(userId: string): Promise<string | null> {
    try {
      return await this._client.get(`dashboard_user:${userId}:status`);
    } catch (err) {
      this._logger.error(`Failed to get cached dashboard user status for ${userId}:`, err);
      return null;
    }
  }

  async setDashboardUserStatus(
    userId: string,
    status: string,
    ttlSeconds = 86400 * 30,
  ): Promise<void> {
    try {
      await this._client.set(`dashboard_user:${userId}:status`, status, 'EX', ttlSeconds);
    } catch (err) {
      this._logger.error(`Failed to cache dashboard user status for ${userId}:`, err);
    }
  }

  private _getCurrentIsoWeek(): string {
    const now = new Date();
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  }

  async getWeeklyTokenUsage(tenantId: string): Promise<number> {
    try {
      const isoWeek = this._getCurrentIsoWeek();
      const isoKey = `tenant:${tenantId}:tokens:${isoWeek}`;
      const raw = await this._client.get(isoKey);
      if (raw) return parseInt(raw, 10) || 0;

      const legacyRaw = await this._client.get(`tenant:${tenantId}:tokens:weekly`);
      return legacyRaw ? parseInt(legacyRaw, 10) || 0 : 0;
    } catch (err) {
      this._logger.error(`Failed to get weekly token usage for ${tenantId}:`, err);
      return 0;
    }
  }

  async recordTokenUsage(
    tenantId: string,
    tokens: number,
    weeklyLimit: number,
  ): Promise<{ current: number; limit: number; exceeded: boolean }> {
    const isoWeek = this._getCurrentIsoWeek();
    const key = `tenant:${tenantId}:tokens:${isoWeek}`;
    try {
      const multi = this._client.multi();
      multi.incrby(key, tokens);
      multi.ttl(key);
      const results = await multi.exec();

      let current = tokens;
      let ttl = -1;
      if (results && results[0] && !results[0][0]) {
        current = Number(results[0][1]);
      }
      if (results && results[1] && !results[1][0]) {
        ttl = Number(results[1][1]);
      }

      if (ttl < 0) {
        await this._client.expire(key, 35 * 24 * 3600);
      }

      const exceeded = weeklyLimit !== -1 && current > weeklyLimit;
      return { current, limit: weeklyLimit, exceeded };
    } catch (err) {
      this._logger.error(`Failed to record token usage for ${tenantId}:`, err);
      return { current: tokens, limit: weeklyLimit, exceeded: false };
    }
  }

  async acquireCrawlLock(tenantId: string, jobId: string, ttlSeconds = 900): Promise<boolean> {
    if (!this._client) return true;
    try {
      const key = `tenant:${tenantId}:crawl:active`;
      const res = await this._client.set(key, jobId, 'EX', ttlSeconds, 'NX');
      return res === 'OK';
    } catch (err) {
      this._logger.error(`Failed to acquire crawl lock for tenant ${tenantId}:`, err);
      return true;
    }
  }

  async releaseCrawlLock(tenantId: string): Promise<void> {
    if (!this._client) return;
    try {
      const key = `tenant:${tenantId}:crawl:active`;
      await this._client.del(key);
    } catch (err) {
      this._logger.error(`Failed to release crawl lock for tenant ${tenantId}:`, err);
    }
  }

  async getActiveCrawlJob(tenantId: string): Promise<string | null> {
    if (!this._client) return null;
    try {
      const key = `tenant:${tenantId}:crawl:active`;
      return await this._client.get(key);
    } catch (err) {
      this._logger.error(`Failed to get active crawl lock for tenant ${tenantId}:`, err);
      return null;
    }
  }

  async getWeeklyCrawlUsage(tenantId: string): Promise<number> {
    if (!this._client) return 0;
    try {
      const isoWeek = this._getCurrentIsoWeek();
      const isoKey = `tenant:${tenantId}:crawls:${isoWeek}`;
      const raw = await this._client.get(isoKey);
      return raw ? parseInt(raw, 10) || 0 : 0;
    } catch (err) {
      this._logger.error(`Failed to get weekly crawl usage for ${tenantId}:`, err);
      return 0;
    }
  }

  async recordCrawlUsage(
    tenantId: string,
    weeklyLimit: number,
  ): Promise<{ current: number; limit: number; exceeded: boolean }> {
    if (!this._client) return { current: 1, limit: weeklyLimit, exceeded: false };
    const isoWeek = this._getCurrentIsoWeek();
    const key = `tenant:${tenantId}:crawls:${isoWeek}`;
    try {
      const multi = this._client.multi();
      multi.incr(key);
      multi.ttl(key);
      const results = await multi.exec();

      let current = 1;
      let ttl = -1;
      if (results && results[0] && !results[0][0]) {
        current = Number(results[0][1]);
      }
      if (results && results[1] && !results[1][0]) {
        ttl = Number(results[1][1]);
      }

      if (ttl < 0) {
        await this._client.expire(key, 35 * 24 * 3600);
      }

      const exceeded = weeklyLimit !== -1 && current > weeklyLimit;
      return { current, limit: weeklyLimit, exceeded };
    } catch (err) {
      this._logger.error(`Failed to record crawl usage for tenant ${tenantId}:`, err);
      return { current: 0, limit: weeklyLimit, exceeded: false };
    }
  }

  async onModuleDestroy() {
    this._logger.log('Disconnecting from Redis');
    if (this._subscriber) await this._subscriber.quit();
    if (this._client) await this._client.quit();
  }
}

