// email.producer.ts
import { Injectable, Inject } from '@nestjs/common';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../config/redis.js'; 
import { IEmailProducer, TenantVerificationEmailPayload, UserInvitationEmailPayload, ForgotPasswordEmailPayload } from '../interfaces/IEmailProducer.js';

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

  async sendUserInvitationEmail(data: UserInvitationEmailPayload): Promise<void> {
    await this.emailQueue.add('send-user-invitation', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
      removeOnFail: 1000,
    });
  }

  async sendForgotPasswordEmail(data: ForgotPasswordEmailPayload): Promise<void> {
    await this.emailQueue.add('send-forgot-password', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
      removeOnFail: 1000,
    });
  }
}