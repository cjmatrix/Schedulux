import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Redis } from 'ioredis';
import type { ICacheRepository, SetOptions } from './cache-repository.interface.js';

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
}
