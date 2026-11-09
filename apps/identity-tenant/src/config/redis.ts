import { Global, Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { PinoLogger } from 'nestjs-pino';

export const REDIS_CLIENT = 'REDIS_CLIENT';

const redisProvider: Provider = {
  provide: REDIS_CLIENT,
  inject: [ConfigService, PinoLogger],
  useFactory: (configService: ConfigService, logger: PinoLogger) => {
    logger.setContext('RedisModule');
    const redisUri = configService.get<string>('REDIS_URI') || 'redis://localhost:6379';

    const client = new Redis(redisUri, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    client.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    client.on('error', (error) => {
      logger.error({ err: error }, `Redis connection error: ${error.message}`);
    });

    return client;
  },
};

@Global()
@Module({
  providers: [redisProvider],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
