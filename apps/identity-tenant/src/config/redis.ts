import { Global, Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

const redisProvider: Provider = {
  provide: REDIS_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const redisUri = configService.get<string>('REDIS_URI') || 'redis://localhost:6379';

    const client = new Redis(redisUri, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    client.on('connect', () => {
      console.log('Redis COnnected');
    });

    client.on('error', (error) => {
      console.log(`Redis connection error: ${error.message}`, error.stack);
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
