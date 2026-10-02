import { Injectable, Inject } from '@nestjs/common';
import { nanoid } from 'nanoid';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../config/redis.js';
import { ICrawlProducer } from '../producers/crawlProducer.js';

@Injectable()
export class KnowledgeService {
  private crawlQueue: Queue;

  constructor(
    @Inject('ICrawlProducer') private crawlProducer: ICrawlProducer,
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
  ) {
    this.crawlQueue = new Queue('knowledge-crawl-queue', {
      connection: this.redisClient,
    });
  }

  async crawlSite(tenant_id: string, url: string) {
    const job_id = `crawl_${nanoid(12)}`;

    await this.crawlProducer.enqueueCrawlJob({
      tenant_id,
      url,
      job_id,
    });

    return {
      message: 'Crawl job queued successfully',
      job_id,
      status: 'queued',
    };
  }

  async getCrawlStatus(tenant_id: string, job_id: string) {
    const job = await this.crawlQueue.getJob(job_id);

    if (!job) {
      throw new Error('CRAWL_JOB_NOT_FOUND');
    }

    const state = await job.getState();

    let pages: Array<{
      url: string;
      markdown: string;
      success: boolean;
      error: string;
    }> = [];
    let pages_crawled = 0;

    if (state === 'completed' && job.returnvalue) {
      const result = job.returnvalue as Record<string, string>;
      pages = Object.entries(result).map(([pageUrl, markdown]) => ({
        url: pageUrl,
        markdown: markdown,
        success: true,
        error: '',
      }));
      pages_crawled = pages.length;
    }

    return {
      job_id,
      status: state,
      pages_crawled,
      pages,
    };
  }
}
