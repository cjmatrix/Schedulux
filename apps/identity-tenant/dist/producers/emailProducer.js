var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var EmailProducer_1;
import { Injectable, Logger } from '@nestjs/common';
import amqp from 'amqplib';
export const EMAIL_QUEUE_NAME = 'email-queue';
let EmailProducer = EmailProducer_1 = class EmailProducer {
    _logger = new Logger(EmailProducer_1.name);
    _connection = null;
    _channel = null;
    _rabbitUri = process.env.RABBITMQ_URI || 'amqp://localhost:5672';
    _connectionPromise = null;
    _channelPromise = null;
    async onModuleInit() {
        await this._ensureChannel();
    }
    async onModuleDestroy() {
        try {
            await this._channel?.close();
            await this._connection?.close();
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            this._logger.warn(`Error during RabbitMQ shutdown: ${msg}`);
        }
    }
    async _ensureChannel() {
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
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                this._logger.error(`[RabbitMQ] Connection error: ${msg}`);
                this._channelPromise = null;
                this._connectionPromise = null;
                throw err;
            }
        })();
        return this._channelPromise;
    }
    async _publish(jobName, data) {
        try {
            const channel = await this._ensureChannel();
            const messageBuffer = Buffer.from(JSON.stringify({
                name: jobName,
                data,
                timestamp: new Date().toISOString(),
            }));
            channel.sendToQueue(EMAIL_QUEUE_NAME, messageBuffer, {
                persistent: true,
                headers: { 'job-name': jobName },
            });
            this._logger.log(`[RabbitMQ] Enqueued '${jobName}' to '${EMAIL_QUEUE_NAME}'`);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            this._logger.error(`[RabbitMQ] Failed to publish '${jobName}': ${msg}`);
            throw err;
        }
    }
    async sendVerificationEmail(data) {
        await this._publish('send-tenant-verification', data);
    }
    async sendUserInvitationEmail(data) {
        await this._publish('send-user-invitation', data);
    }
    async sendForgotPasswordEmail(data) {
        await this._publish('send-forgot-password', data);
    }
};
EmailProducer = EmailProducer_1 = __decorate([
    Injectable()
], EmailProducer);
export { EmailProducer };
