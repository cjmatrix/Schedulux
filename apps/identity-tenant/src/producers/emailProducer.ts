import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import amqp, { Channel, ChannelModel } from 'amqplib';
import {
  ForgotPasswordEmailPayload,
  IEmailProducer,
  TenantVerificationEmailPayload,
  UserInvitationEmailPayload,
} from '../interfaces/IEmailProducer.js';

export const EMAIL_QUEUE_NAME = 'email-queue';

@Injectable()
export class EmailProducer implements IEmailProducer, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailProducer.name);
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private readonly rabbitUri = process.env.RABBITMQ_URI || 'amqp://localhost:5672';

  async onModuleInit() {
    await this.ensureChannel();
  }

  async onModuleDestroy() {
    try {
      await this.channel?.close();
      await this.connection?.close();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Error during RabbitMQ shutdown: ${msg}`);
    }
  }

  private connectionPromise: Promise<ChannelModel> | null = null;
  private channelPromise: Promise<Channel> | null = null;

  private async ensureChannel(): Promise<Channel> {
    if (this.channel) {
      return this.channel;
    }

    if (this.channelPromise) {
      return this.channelPromise;
    }

    this.channelPromise = (async () => {
      try {
        if (!this.connectionPromise) {
          this.connectionPromise = amqp.connect(this.rabbitUri);
        }
        this.connection = await this.connectionPromise;

        this.channel = await this.connection.createChannel();
        await this.channel.assertQueue(EMAIL_QUEUE_NAME, { durable: true });

        this.channel.on('close', () => {
          this.logger.warn('[RabbitMQ] Channel closed. Resetting connection tokens.');
          this.channel = null;
          this.channelPromise = null;
          this.connectionPromise = null;
        });

        this.logger.log(`[RabbitMQ] Connected and asserted queue '${EMAIL_QUEUE_NAME}'`);
        return this.channel;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`[RabbitMQ] Connection error: ${msg}`);

        this.channelPromise = null;
        this.connectionPromise = null;
        throw err;
      }
    })();

    return this.channelPromise;
  }

  private async publish<T extends object>(jobName: string, data: T): Promise<void> {
    try {
      const channel = await this.ensureChannel();
      const messageBuffer = Buffer.from(
        JSON.stringify({
          name: jobName,
          data,
          timestamp: new Date().toISOString(),
        }),
      );

      channel.sendToQueue(EMAIL_QUEUE_NAME, messageBuffer, {
        persistent: true,
        headers: { 'job-name': jobName },
      });
      this.logger.log(`[RabbitMQ] Enqueued '${jobName}' to '${EMAIL_QUEUE_NAME}'`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`[RabbitMQ] Failed to publish '${jobName}': ${msg}`);
      throw err;
    }
  }

  async sendVerificationEmail(data: TenantVerificationEmailPayload): Promise<void> {
    await this.publish('send-tenant-verification', data);
  }

  async sendUserInvitationEmail(data: UserInvitationEmailPayload): Promise<void> {
    await this.publish('send-user-invitation', data);
  }

  async sendForgotPasswordEmail(data: ForgotPasswordEmailPayload): Promise<void> {
    await this.publish('send-forgot-password', data);
  }
}
