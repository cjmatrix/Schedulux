import { Global, Module } from '@nestjs/common';
import { RedisService } from '../services/redis.service.js';
import { ThrottlerStorageRedisService } from '../services/throttler-storage-redis.service.js';

@Global()
@Module({
  providers: [RedisService, ThrottlerStorageRedisService],
  exports: [RedisService, ThrottlerStorageRedisService],
})
export class RedisModule {}

