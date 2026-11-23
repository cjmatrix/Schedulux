import { Injectable, Logger } from '@nestjs/common';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import {
  ForgotPasswordEmailPayload,
  IEmailProducer,
  TenantVerificationEmailPayload,
  UserInvitationEmailPayload,
} from '../interfaces/IEmailProducer.js';

@Injectable()
export class SqsEmailProducer implements IEmailProducer {
  private readonly _logger = new Logger(SqsEmailProducer.name);
  private readonly _client: SQSClient;
  private readonly _queueUrl: string;

  constructor() {
    const region = process.env.AWS_REGION || 'ap-south-1';
    this._queueUrl = process.env.AWS_SQS_EMAIL_QUEUE_URL || '';
    this._client = new SQSClient({ region });
  }

  private async _publish<T extends object>(jobName: string, data: T): Promise<void> {
    if (!this._queueUrl) {
      this._logger.warn(`AWS_SQS_EMAIL_QUEUE_URL is not configured. Skipping SQS enqueue for '${jobName}'`);
      return;
    }

    try {
      const command = new SendMessageCommand({
        QueueUrl: this._queueUrl,
        MessageBody: JSON.stringify({
          name: jobName,
          data,
          timestamp: new Date().toISOString(),
        }),
      });
      await this._client.send(command);
      this._logger.log(`[SQS] Enqueued '${jobName}' to SQS queue`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this._logger.error(`[SQS] Failed to publish '${jobName}': ${msg}`);
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
