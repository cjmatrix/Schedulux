import { Global, Logger, Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { CacheRepository } from './cache.repository.js';

export const REDIS_CLIENT = 'REDIS_CLIENT';
export const CACHE_REPOSITORY = 'ICacheRepository';

const redisProvider: Provider = {
  provide: REDIS_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const logger = new Logger('RedisModule');
    const redisUri = configService.get<string>('REDIS_URI');
    if (!redisUri) {
      logger.warn('REDIS_URI not configured. CacheRepository will use in-memory fallback.');
      return null;
    }

    try {
      const client = new Redis(redisUri, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: false,
        retryStrategy: (times) => {
          if (times > 5) return null;
          return Math.min(times * 100, 2000);
        },
      });

      client.on('connect', () => {
        logger.log('Redis connected successfully for scheduling-inventory');
      });

      client.on('error', (error) => {
        logger.error(`Redis connection error: ${error.message}`);
      });

      return client;
    } catch (err: unknown) {
      logger.error(`Failed to initialize Redis client: ${err}`);
      return null;
    }
  },
};

@Global()
@Module({
  providers: [
    redisProvider,
    {
      provide: CACHE_REPOSITORY,
      useClass: CacheRepository,
    },
  ],
  exports: [REDIS_CLIENT, CACHE_REPOSITORY],
})
export class RedisModule {}
