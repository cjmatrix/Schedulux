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
    logger = new Logger(EmailProducer_1.name);
    connection = null;
    channel = null;
    rabbitUri = process.env.RABBITMQ_URI || 'amqp://localhost:5672';
    async onModuleInit() {
        await this.ensureChannel();
    }
    async onModuleDestroy() {
        try {
            await this.channel?.close();
            await this.connection?.close();
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            this.logger.warn(`Error during RabbitMQ shutdown: ${msg}`);
        }
    }
    connectionPromise = null;
    channelPromise = null;
    async ensureChannel() {
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
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                this.logger.error(`[RabbitMQ] Connection error: ${msg}`);
                this.channelPromise = null;
                this.connectionPromise = null;
                throw err;
            }
        })();
        return this.channelPromise;
    }
    async publish(jobName, data) {
        try {
            const channel = await this.ensureChannel();
            const messageBuffer = Buffer.from(JSON.stringify({
                name: jobName,
                data,
                timestamp: new Date().toISOString(),
            }));
            channel.sendToQueue(EMAIL_QUEUE_NAME, messageBuffer, {
                persistent: true,
                headers: { 'job-name': jobName },
            });
            this.logger.log(`[RabbitMQ] Enqueued '${jobName}' to '${EMAIL_QUEUE_NAME}'`);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            this.logger.error(`[RabbitMQ] Failed to publish '${jobName}': ${msg}`);
            throw err;
        }
    }
    async sendVerificationEmail(data) {
        await this.publish('send-tenant-verification', data);
    }
    async sendUserInvitationEmail(data) {
        await this.publish('send-user-invitation', data);
    }
    async sendForgotPasswordEmail(data) {
        await this.publish('send-forgot-password', data);
    }
};
EmailProducer = EmailProducer_1 = __decorate([
    Injectable()
], EmailProducer);
export { EmailProducer };
