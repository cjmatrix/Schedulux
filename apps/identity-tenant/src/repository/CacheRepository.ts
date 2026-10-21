import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ICacheRepository, SetOptions } from '../interfaces/ICacheRepository.js';

@Injectable()
export class CacheRepository implements ICacheRepository {
  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

  async get(key: string): Promise<string | null> {
    return await this.redisClient.get(key);
  }

  async set(key: string, value: string, options?: SetOptions): Promise<void> {
    if (options?.EX) {
      await this.redisClient.set(key, value, 'EX', options.EX);
    } else if (options?.PX) {
      await this.redisClient.set(key, value, 'PX', options.PX);
    } else if (options?.ttlSeconds) {
      await this.redisClient.set(key, value, 'EX', options.ttlSeconds);
    } else {
      await this.redisClient.set(key, value);
    }
  }

  async delete(key: string): Promise<boolean> {
    const result = await this.redisClient.del(key);
    return result > 0;
  }

  async ttl(key: string): Promise<number> {
    return await this.redisClient.ttl(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redisClient.exists(key);
    return result > 0;
  }
}
