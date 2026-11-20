import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import {
  DEFAULT_TIER,
  resolveTierConfigWithCache,
  STATIC_TIER_CONFIGS,
  TierConfig,
} from '../constants/tiers.constant.js';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly _logger = new Logger(RedisService.name);
  private _client: Redis | null = null;
  private _isConnected = false;

  constructor(
    @Optional()
    @Inject(ConfigService)
    private readonly _configService?: ConfigService,
  ) {}

  onModuleInit() {
    const redisUri =
      this._configService?.get<string>('REDIS_URI') || process.env.REDIS_URI;
    const redisHost =
      this._configService?.get<string>('REDIS_HOST') || process.env.REDIS_HOST || 'localhost';
    const redisPort = Number(
      this._configService?.get<number>('REDIS_PORT') || process.env.REDIS_PORT || 6379,
    );

    try {
      if (redisUri) {
        this._logger.log(`Connecting to Redis cluster via URI: ${redisUri.replace(/:[^:@]+@/, ':***@')}`);
        this._client = new Redis(redisUri, {
          maxRetriesPerRequest: 2,
          enableReadyCheck: true,
          lazyConnect: true,
        });
      } else {
        this._logger.log(`Connecting to Redis: ${redisHost}:${redisPort}`);
        this._client = new Redis({
          host: redisHost,
          port: redisPort,
          maxRetriesPerRequest: 2,
          lazyConnect: true,
        });
      }

      this._client.on('connect', () => {
        this._isConnected = true;
        this._logger.log('Redis client connected successfully');
      });

      this._client.on('error', (err) => {
        this._isConnected = false;
        this._logger.warn(`Redis connection warning: ${err.message}`);
      });

      this._client.connect().catch((err) => {
        this._logger.warn(`Initial Redis connection deferred: ${err.message}`);
      });
    } catch (err) {
      this._logger.warn(`Failed to initialize Redis client: ${(err as Error).message}`);
    }
  }

  async onModuleDestroy() {
    if (this._client) {
      try {
        await this._client.quit();
      } catch {
        this._client.disconnect();
      }
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this._client || !this._isConnected) {
      return null;
    }
    try {
      return await this._client.get(key);
    } catch (err) {
      this._logger.warn(`Redis GET failed for key ${key}: ${(err as Error).message}`);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this._client || !this._isConnected) {
      return;
    }
    try {
      if (ttlSeconds && ttlSeconds > 0) {
        await this._client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this._client.set(key, value);
      }
    } catch (err) {
      this._logger.warn(`Redis SET failed for key ${key}: ${(err as Error).message}`);
    }
  }

  async del(...keys: string[]): Promise<void> {
    if (!this._client || !this._isConnected || keys.length === 0) {
      return;
    }
    try {
      await this._client.del(...keys);
    } catch (err) {
      this._logger.warn(`Redis DEL failed: ${(err as Error).message}`);
    }
  }

  getClient(): Redis | null {
    return this._client;
  }

  async getTenantTier(tenantId: string): Promise<string> {
    try {
      const tier = await this.get(`tenant:${tenantId}:tier`);
      return tier ? tier.trim().toLowerCase() : DEFAULT_TIER;
    } catch (err) {
      this._logger.warn(`Failed to resolve tenant tier for ${tenantId}:`, err);
      return DEFAULT_TIER;
    }
  }

  async getCachedTierConfig(tier?: string | null): Promise<TierConfig> {
    return resolveTierConfigWithCache(this, tier);
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
      const raw = await this.get(`tenant:${tenantId}:tokens:${isoWeek}`);
      return raw ? parseInt(raw, 10) || 0 : 0;
    } catch (err) {
      this._logger.warn(`Failed to resolve weekly token usage for ${tenantId}:`, err);
      return 0;
    }
  }

  async getTierRateLimit(tenantId: string): Promise<number> {
    try {
      const tier = await this.getTenantTier(tenantId);
      const tierConfig = await this.getCachedTierConfig(tier);
      return (
        Number(tierConfig.rate_limit_rpm) ||
        STATIC_TIER_CONFIGS[DEFAULT_TIER].rate_limit_rpm
      );
    } catch (err) {
      this._logger.warn(
        `Failed to resolve rate limit RPM for tenant ${tenantId}, using fallback:`,
        err,
      );
      return STATIC_TIER_CONFIGS[DEFAULT_TIER].rate_limit_rpm;
    }
  }
}

