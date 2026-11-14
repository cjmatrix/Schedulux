import { Logger } from '@nestjs/common';
import { STATIC_TIER_CONFIGS } from '../constants/tiers.constant.js';
import { TierConfigModel } from '../model/TierConfig.js';

export async function seedTierConfigs(logger?: Logger | { log: (msg: string, ctx?: string) => void }): Promise<void> {
  const log = (msg: string) => {
    if (logger) {
      logger.log(msg, 'SeedTierConfigs');
    } else {
      console.log(`[SeedTierConfigs] ${msg}`);
    }
  };

  try {
    const operations = Object.entries(STATIC_TIER_CONFIGS).map(([key, config]) => ({
      updateOne: {
        filter: { tier: config.tier },
        update: {
          $set: {
            _id: `tier_${config.tier}`,
            tier: config.tier,
            name: config.name,
            max_agents: config.max_agents,
            max_services: config.max_services,
            max_resources: config.max_resources,
            max_kb_docs: config.max_kb_docs,
            max_kb_doc_size_mb: config.max_kb_doc_size_mb,
            weekly_token_limit: config.weekly_token_limit,
            rate_limit_rpm: config.rate_limit_rpm,
            status: config.status,
            description: config.description || '',
          },
        },
        upsert: true,
      },
    }));

    if (operations.length > 0) {
      const result = await TierConfigModel.bulkWrite(operations);
      log(`Tier configurations synchronized to MongoDB. Upserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}`);
    }

    try {
      const redisUri = process.env.REDIS_URI || 'redis://localhost:6379';
      const { Redis } = await import('ioredis');
      const redis = new Redis(redisUri, { lazyConnect: true, maxRetriesPerRequest: 1 });
      await redis.connect();
      const allConfigs = await TierConfigModel.find({}).lean();
      if (allConfigs.length > 0) {
        await redis.set('tier_config:all', JSON.stringify(allConfigs), 'EX', 86400 * 7);
        for (const cfg of allConfigs) {
          await redis.set(`tier_config:${cfg.tier}`, JSON.stringify(cfg), 'EX', 86400 * 7);
        }
        log('Tier configurations pre-warmed into Redis cache.');
      }
      await redis.quit();
    } catch {
      // Non-blocking Redis cache warm
    }
  } catch (error) {
    if (logger) {
      (logger as Logger).error?.('Failed to seed tier configs into MongoDB', error);
    } else {
      console.error('[SeedTierConfigs] Error:', error);
    }
  }
}

