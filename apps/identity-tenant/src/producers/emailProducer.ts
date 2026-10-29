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
  private readonly _logger = new Logger(EmailProducer.name);
  private _connection: ChannelModel | null = null;
  private _channel: Channel | null = null;
  private readonly _rabbitUri = process.env.RABBITMQ_URI || 'amqp://localhost:5672';
  private _connectionPromise: Promise<ChannelModel> | null = null;
  private _channelPromise: Promise<Channel> | null = null;

  async onModuleInit() {
    await this._ensureChannel();
  }

  async onModuleDestroy() {
    try {
      await this._channel?.close();
      await this._connection?.close();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this._logger.warn(`Error during RabbitMQ shutdown: ${msg}`);
    }
  }

  private async _ensureChannel(): Promise<Channel> {
    if (this._channel) {
      return this._channel;
    }

    if (this._channelPromise) {
      return this._channelPromise;
    }

    this._channelPromise = (async () => {
      try {
        if (!this._connectionPromise) {
          this._connectionPromise = amqp.connect(this._rabbitUri);
        }
        this._connection = await this._connectionPromise;

        this._channel = await this._connection.createChannel();
        await this._channel.assertQueue(EMAIL_QUEUE_NAME, { durable: true });

        this._channel.on('close', () => {
          this._logger.warn('[RabbitMQ] Channel closed. Resetting connection tokens.');
          this._channel = null;
          this._channelPromise = null;
          this._connectionPromise = null;
        });

        this._logger.log(`[RabbitMQ] Connected and asserted queue '${EMAIL_QUEUE_NAME}'`);
        return this._channel;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this._logger.error(`[RabbitMQ] Connection error: ${msg}`);

        this._channelPromise = null;
        this._connectionPromise = null;
        throw err;
      }
    })();

    return this._channelPromise;
  }

  private async _publish<T extends object>(jobName: string, data: T): Promise<void> {
    try {
      const channel = await this._ensureChannel();
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
      this._logger.log(`[RabbitMQ] Enqueued '${jobName}' to '${EMAIL_QUEUE_NAME}'`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this._logger.error(`[RabbitMQ] Failed to publish '${jobName}': ${msg}`);
      throw err;
    }
  }

  async sendVerificationEmail(data: TenantVerificationEmailPayload): Promise<void> {
    await this._publish('send-tenant-verification', data);
  }

  async sendUserInvitationEmail(data: UserInvitationEmailPayload): Promise<void> {
    await this._publish('send-user-invitation', data);
  }

  async sendForgotPasswordEmail(data: ForgotPasswordEmailPayload): Promise<void> {
    await this._publish('send-forgot-password', data);
  }
}

