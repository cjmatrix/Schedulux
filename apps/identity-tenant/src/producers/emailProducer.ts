// email.producer.ts
import { Injectable, Inject } from '@nestjs/common';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../config/redis.js'; 
import { IEmailProducer, TenantVerificationEmailPayload } from '../interfaces/IEmailProducer.js';

@Injectable()
export class EmailProducer implements IEmailProducer {
  private emailQueue: Queue;

  constructor(@Inject(REDIS_CLIENT) private readonly redisClient: Redis) {
    this.emailQueue = new Queue('email-queue', {
      connection: this.redisClient,
    });
  }

  async sendVerificationEmail(data: TenantVerificationEmailPayload): Promise<void> {
    await this.emailQueue.add('send-tenant-verification', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
      removeOnFail: 1000,
    });
  }
}