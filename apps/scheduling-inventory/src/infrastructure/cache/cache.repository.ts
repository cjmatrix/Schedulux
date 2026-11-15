import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Redis } from 'ioredis';
import type { ActiveHoldInfo, ICacheRepository, SetOptions } from './cache-repository.interface.js';

@Injectable()
export class CacheRepository implements ICacheRepository {
  private readonly _logger = new Logger(CacheRepository.name);

  constructor(@Inject('REDIS_CLIENT') private readonly _redisClient: Redis) {}

  async get(key: string): Promise<string | null> {
    try {
      return await this._redisClient.get(key);
    } catch (err: unknown) {
      this._logger.error(`Redis get error for key "${key}": ${err}`);
      return null;
    }
  }

  async mget(keys: string[]): Promise<(string | null)[]> {
    if (!keys || keys.length === 0) return [];
    try {
      return await this._redisClient.mget(keys);
    } catch (err: unknown) {
      this._logger.error(`Redis mget error for ${keys.length} keys: ${err}`);
      return new Array(keys.length).fill(null);
    }
  }

  async set(key: string, value: string, options?: SetOptions): Promise<void> {
    try {
      if (options?.EX) {
        await this._redisClient.set(key, value, 'EX', options.EX);
      } else if (options?.PX) {
        await this._redisClient.set(key, value, 'PX', options.PX);
      } else if (options?.ttlSeconds) {
        await this._redisClient.set(key, value, 'EX', options.ttlSeconds);
      } else {
        await this._redisClient.set(key, value);
      }
    } catch (err: unknown) {
      this._logger.error(`Redis set error for key "${key}": ${err}`);
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const result = await this._redisClient.unlink(key);
      return result > 0;
    } catch (err: unknown) {
      this._logger.error(`Redis del error for key "${key}": ${err}`);
      return false;
    }
  }

  async deleteMany(keys: string[]): Promise<number> {
    if (!keys || keys.length === 0) return 0;
    try {
      return await this._redisClient.unlink(...keys);
    } catch (err: unknown) {
      this._logger.error(`Redis delMany error for ${keys.length} keys: ${err}`);
      return 0;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this._redisClient.ttl(key);
    } catch (err: unknown) {
      this._logger.error(`Redis ttl error for key "${key}": ${err}`);
      return -1;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this._redisClient.exists(key);
      return result > 0;
    } catch (err: unknown) {
      this._logger.error(`Redis exists error for key "${key}": ${err}`);
      return false;
    }
  }

  async scanKeys(pattern: string): Promise<string[]> {
    try {
      return await new Promise<string[]>((resolve, reject) => {
        const stream = this._redisClient.scanStream({
          match: pattern,
          count: 100,
        });
        const matchedKeys: string[] = [];
        stream.on('data', (resultKeys: string[]) => {
          for (const k of resultKeys) {
            matchedKeys.push(k);
          }
        });
        stream.on('end', () => resolve(matchedKeys));
        stream.on('error', (err) => reject(err));
      });
    } catch (err: unknown) {
      this._logger.error(`Redis scanKeys error for pattern "${pattern}": ${err}`);
      return [];
    }
  }

  async getActiveHolds(tenantId: string, agentId: string): Promise<ActiveHoldInfo[]> {
    try {
      const pattern = `sched:hold:${tenantId}:${agentId}:*`;
      const keys = await this.scanKeys(pattern);
      if (keys.length === 0) return [];

      const values = await this._redisClient.mget(keys);
      const holds: ActiveHoldInfo[] = [];

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const holdToken = values[i];
        if (!holdToken) continue;

       
        const parts = key.split(':');
        if (parts.length >= 6) {
          const resourceId = parts[4];
          const startTimeStr = parts.slice(5).join(':');
          const startTimeMs = new Date(startTimeStr).getTime();
          holds.push({
            key,
            resourceId,
            startTime: startTimeStr,
            startTimeMs,
            holdToken,
          });
        }
      }
      return holds;
    } catch (err: unknown) {
      this._logger.error(
        `Failed to get active holds for tenant ${tenantId}, agent ${agentId}: ${err}`,
      );
      return [];
    }
  }

  async releaseSlotHolds(
    tenantId: string,
    agentId: string,
    resourceIds: string[],
    startTime: string,
    holdToken?: string,
  ): Promise<number> {
    try {
      const holds = await this.getActiveHolds(tenantId, agentId);
      const targetTimeMs = new Date(startTime).getTime();
      const resIdSet = new Set(resourceIds);

      const keysToDelete: string[] = [];
      for (const hold of holds) {
        if (resIdSet.has(hold.resourceId)) {
          const timeDiff = Math.abs(hold.startTimeMs - targetTimeMs);
          if (timeDiff < 1000) {
            if (!holdToken || hold.holdToken === holdToken) {
              keysToDelete.push(hold.key);
            }
          }
        }
      }

      if (keysToDelete.length > 0) {
        return await this.deleteMany(keysToDelete);
      }
      return 0;
    } catch (err: unknown) {
      this._logger.error(`Failed to release slot holds for tenant ${tenantId}: ${err}`);
      return 0;
    }
  }
}
