import amqp from 'amqplib';
import { emailService, } from '../services/emailService.js';
export const EMAIL_QUEUE_NAME = 'email-queue';
export const EMAIL_RETRY_QUEUE_NAME = 'email-retry-queue';
export const EMAIL_DLQ_NAME = 'email-dlq';
export const MAX_RETRY_COUNT = 3;
export const RETRY_DELAY_MS = 10000;
export const createEmailWorker = async () => {
    const rabbitUri = process.env.RABBITMQ_URI || 'amqp://localhost:5672';
    console.log(`[EmailWorker] Connecting to RabbitMQ at ${rabbitUri}...`);
    const connection = await amqp.connect(rabbitUri);
    const channel = await connection.createChannel();
    await channel.assertQueue(EMAIL_QUEUE_NAME, { durable: true });
    await channel.assertQueue(EMAIL_RETRY_QUEUE_NAME, {
        durable: true,
        arguments: {
            'x-message-ttl': RETRY_DELAY_MS,
            'x-dead-letter-exchange': '',
            'x-dead-letter-routing-key': EMAIL_QUEUE_NAME,
        },
    });
    await channel.assertQueue(EMAIL_DLQ_NAME, { durable: true });
    await channel.prefetch(5);
    console.log(`[EmailWorker] Listening on '${EMAIL_QUEUE_NAME}' with retry queue '${EMAIL_RETRY_QUEUE_NAME}' (${RETRY_DELAY_MS / 1000}s TTL) and DLQ '${EMAIL_DLQ_NAME}'`);
    const consumerTag = (await channel.consume(EMAIL_QUEUE_NAME, async (msg) => {
        if (!msg)
            return;
        let jobName = 'unknown';
        try {
            const content = JSON.parse(msg.content.toString());
            jobName = content.name || msg.properties?.headers?.['job-name'] || 'unknown';
            const payload = content.data || {};
            console.log(`[EmailWorker] Processing job '${jobName}'`);
            switch (jobName) {
                case 'send-tenant-verification':
                    await emailService.sendTenantVerificationEmail(payload);
                    break;
                case 'send-user-invitation':
                    await emailService.sendUserInvitationEmail(payload);
                    break;
                case 'send-forgot-password':
                    await emailService.sendForgotPasswordEmail(payload);
                    break;
                default:
                    console.warn(`[EmailWorker] Unknown job type: ${jobName}`);
            }
            channel.ack(msg);
            console.log(`[EmailWorker] Job '${jobName}' completed successfully`);
        }
        catch (err) {
            const currentRetries = Number(msg.properties?.headers?.['x-retry-count'] || 0);
            if (currentRetries < MAX_RETRY_COUNT) {
                const nextRetry = currentRetries + 1;
                console.warn(`[EmailWorker] Job '${jobName}' failed (attempt ${nextRetry}/${MAX_RETRY_COUNT}). Retrying in ${RETRY_DELAY_MS / 1000}s... Error: ${err.message}`);
                channel.sendToQueue(EMAIL_RETRY_QUEUE_NAME, msg.content, {
                    persistent: true,
                    headers: {
                        ...msg.properties?.headers,
                        'job-name': jobName,
                        'x-retry-count': nextRetry,
                        'x-last-error': err.message,
                        'x-last-failed-at': new Date().toISOString(),
                    },
                });
                channel.ack(msg);
            }
            else {
                console.error(`[EmailWorker] Job '${jobName}' exceeded max retries (${MAX_RETRY_COUNT}). Moved to DLQ '${EMAIL_DLQ_NAME}'. Error: ${err.message}`);
                channel.sendToQueue(EMAIL_DLQ_NAME, msg.content, {
                    persistent: true,
                    headers: {
                        ...msg.properties?.headers,
                        'job-name': jobName,
                        'x-retry-count': currentRetries,
                        'x-final-error': err.message,
                        'x-failed-at': new Date().toISOString(),
                    },
                });
                channel.ack(msg);
            }
        }
    }, { noAck: false })).consumerTag;
    return {
        close: async () => {
            try {
                console.log('[EmailWorker] Closing RabbitMQ consumer and connection...');
                await channel.cancel(consumerTag);
                await channel.close();
                await connection.close();
                console.log('[EmailWorker] RabbitMQ connection closed gracefully.');
            }
            catch (err) {
                console.error('[EmailWorker] Error closing RabbitMQ worker:', err.message);
            }
        },
    };
};
