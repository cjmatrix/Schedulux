import { Inject, Injectable, Logger } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { RedisService } from './redis.service.js';

export type ThrottlerStorageRecord = Awaited<ReturnType<ThrottlerStorage['increment']>>;

@Injectable()
export class ThrottlerStorageRedisService implements ThrottlerStorage {
  private readonly _logger = new Logger(ThrottlerStorageRedisService.name);

  constructor(
    @Inject(RedisService)
    private readonly _redisService: RedisService,
  ) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const client = this._redisService.getClient?.();
    const redisKey = `throttler:${throttlerName}:${key}`;
    const ttlMs = Math.max(1, Math.floor(ttl));
    const blockDurationMs = Math.max(0, Math.floor(blockDuration || 0));

    if (!client) {
      return {
        totalHits: 1,
        timeToExpire: Math.ceil(ttlMs / 1000),
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    }

    const script = `
      local key = KEYS[1]
      local ttl_ms = tonumber(ARGV[1])
      local limit = tonumber(ARGV[2])
      local block_duration_ms = tonumber(ARGV[3])

      local current = redis.call('INCR', key)
      if current == 1 then
        redis.call('PEXPIRE', key, ttl_ms)
      end

      local pttl = redis.call('PTTL', key)
      if pttl < 0 then
        redis.call('PEXPIRE', key, ttl_ms)
        pttl = ttl_ms
      end

      local is_blocked = current > limit
      local time_to_block_expire = 0

      if is_blocked and block_duration_ms > 0 then
        if pttl < block_duration_ms then
          redis.call('PEXPIRE', key, block_duration_ms)
          pttl = block_duration_ms
        end
      end

      local time_to_expire = math.ceil(pttl / 1000)
      if is_blocked then
        time_to_block_expire = time_to_expire
      end

      return { current, time_to_expire, is_blocked and 1 or 0, time_to_block_expire }
    `;

    try {
      const res = (await client.eval(script, 1, redisKey, ttlMs, limit, blockDurationMs)) as [
        number,
        number,
        number,
        number,
      ];

      const totalHits = Number(res[0]);
      const timeToExpire = Math.max(0, Number(res[1]));
      const isBlocked = Number(res[2]) === 1;
      const timeToBlockExpire = Math.max(0, Number(res[3]));

      return {
        totalHits,
        timeToExpire,
        isBlocked,
        timeToBlockExpire,
      };
    } catch (err) {
      this._logger.warn(`Redis throttler error for key ${redisKey}, failing open:`, err);
      return {
        totalHits: 1,
        timeToExpire: Math.ceil(ttlMs / 1000),
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    }
  }
}
