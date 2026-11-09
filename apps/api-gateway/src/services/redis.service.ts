import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
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

  /**
   * Atomic sliding-window / counter rate check via Lua script.
   * Returns allowed status, remaining requests, and reset TTL in seconds.
   */
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

  async setTenantTier(tenantId: string, tier: string, ttlSeconds = 3600): Promise<void> {
    try {
      await this._client.set(`tenant:${tenantId}:tier`, tier, 'EX', ttlSeconds);
    } catch (err) {
      this._logger.error(`Failed to cache tenant tier for ${tenantId}:`, err);
    }
  }

  async getWeeklyTokenUsage(tenantId: string): Promise<number> {
    try {
      const raw = await this._client.get(`tenant:${tenantId}:tokens:weekly`);
      return raw ? parseInt(raw, 10) || 0 : 0;
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
    const key = `tenant:${tenantId}:tokens:weekly`;
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

      // If key doesn't have an expiration (ttl == -1), set it to 7 days
      if (ttl < 0) {
        await this._client.expire(key, 7 * 24 * 3600);
      }

      const exceeded = weeklyLimit !== -1 && current > weeklyLimit;
      return { current, limit: weeklyLimit, exceeded };
    } catch (err) {
      this._logger.error(`Failed to record token usage for ${tenantId}:`, err);
      return { current: tokens, limit: weeklyLimit, exceeded: false };
    }
  }

  async onModuleDestroy() {
    this._logger.log('Disconnecting from Redis');
    if (this._subscriber) await this._subscriber.quit();
    if (this._client) await this._client.quit();
  }
}

