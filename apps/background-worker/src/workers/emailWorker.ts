import { Worker, Job } from 'bullmq';
import { workerRedisConnection } from '../config/redis.js';
import { emailService, TenantVerificationEmailData, UserInvitationEmailData, ForgotPasswordEmailData } from '../services/emailService.js';

export const EMAIL_QUEUE_NAME = 'email-queue';

export const createEmailWorker = () => {
  const worker = new Worker(
    EMAIL_QUEUE_NAME,
    async (job: Job) => {
      console.log(` [EmailWorker] Processing job ${job.id} (name: ${job.name})`);

      switch (job.name) {
        case 'send-tenant-verification': {
          const payload = job.data as TenantVerificationEmailData;
          await emailService.sendTenantVerificationEmail(payload);
          return { status: 'sent', recipient: payload.to };
        }

        case 'send-user-invitation': {
          const payload = job.data as UserInvitationEmailData;
          await emailService.sendUserInvitationEmail(payload);
          return { status: 'sent', recipient: payload.to };
        }

        case 'send-forgot-password': {
          const payload = job.data as ForgotPasswordEmailData;
          await emailService.sendForgotPasswordEmail(payload);
          return { status: 'sent', recipient: payload.to };
        }

        default:
          console.warn(`[EmailWorker] Unknown job name: ${job.name}`);
          throw new Error(`Unsupported job name: ${job.name}`);
      }
    },
    {
      connection: workerRedisConnection,
      concurrency: 5, 
    }
  );

  worker.on('completed', (job: Job) => {
    console.log(`[EmailWorker] Job ${job.id} (${job.name}) completed successfully`);
  });

  worker.on('failed', (job: Job | undefined, err: Error) => {
    console.error(` [EmailWorker] Job ${job?.id} (${job?.name}) failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error(' [EmailWorker] Worker system error:', err);
  });

  return worker;
};
