import { Worker } from 'bullmq';
import { workerRedisConnection } from '../config/redis.js';
import { emailService } from '../services/emailService.js';
export const EMAIL_QUEUE_NAME = 'email-queue';
export const createEmailWorker = () => {
    const worker = new Worker(EMAIL_QUEUE_NAME, async (job) => {
        console.log(` [EmailWorker] Processing job ${job.id} (name: ${job.name})`);
        switch (job.name) {
            case 'send-tenant-verification': {
                const payload = job.data;
                await emailService.sendTenantVerificationEmail(payload);
                return { status: 'sent', recipient: payload.to };
            }
            case 'send-user-invitation': {
                const payload = job.data;
                await emailService.sendUserInvitationEmail(payload);
                return { status: 'sent', recipient: payload.to };
            }
            case 'send-forgot-password': {
                const payload = job.data;
                await emailService.sendForgotPasswordEmail(payload);
                return { status: 'sent', recipient: payload.to };
            }
            default:
                console.warn(`[EmailWorker] Unknown job name: ${job.name}`);
                throw new Error(`Unsupported job name: ${job.name}`);
        }
    }, {
        connection: workerRedisConnection,
        concurrency: 5,
    });
    worker.on('completed', (job) => {
        console.log(`[EmailWorker] Job ${job.id} (${job.name}) completed successfully`);
    });
    worker.on('failed', (job, err) => {
        console.error(` [EmailWorker] Job ${job?.id} (${job?.name}) failed:`, err.message);
    });
    worker.on('error', (err) => {
        console.error(' [EmailWorker] Worker system error:', err);
    });
    return worker;
};
