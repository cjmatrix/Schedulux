import { Injectable, Inject } from '@nestjs/common';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../config/redis.js';

export interface CrawlJobPayload {
  tenant_id: string;
  url: string;
  job_id: string;
}

export interface ICrawlProducer {
  enqueueCrawlJob(data: CrawlJobPayload): Promise<string>;
}

@Injectable()
export class CrawlProducer implements ICrawlProducer {
  private crawlQueue: Queue;

  constructor(@Inject(REDIS_CLIENT) private readonly redisClient: Redis) {
    this.crawlQueue = new Queue('knowledge-crawl-queue', {
      connection: this.redisClient,
    });
  }

  async enqueueCrawlJob(data: CrawlJobPayload): Promise<string> {
    const job = await this.crawlQueue.add('crawl-site', data, {
      jobId: data.job_id,
      attempts: 2,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: false,
      removeOnFail: false,
    });
    return job.id!;
  }
}
