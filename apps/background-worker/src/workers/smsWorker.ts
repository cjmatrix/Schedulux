import amqp, { Channel, ChannelModel, ConsumeMessage } from 'amqplib';
import {
  BookingCancelledSmsData,
  BookingCreatedSmsData,
  OtpSmsData,
  RawSmsData,
  smsService,
} from '../services/smsService.js';

export const SMS_QUEUE_NAME = 'sms-queue';
export const SMS_RETRY_QUEUE_NAME = 'sms-retry-queue';
export const SMS_DLQ_NAME = 'sms-dlq';
export const MAX_RETRY_COUNT = 3;
export const RETRY_DELAY_MS = 10000;

export interface SmsWorkerController {
  close: () => Promise<void>;
}

export const createSmsWorker = async (): Promise<SmsWorkerController> => {
  const rabbitUri = process.env.RABBITMQ_URI || 'amqp://localhost:5672';
  console.log(`[SmsWorker] Connecting to RabbitMQ at ${rabbitUri}...`);

  const connection: ChannelModel = await amqp.connect(rabbitUri);
  const channel: Channel = await connection.createChannel();

  await channel.assertQueue(SMS_QUEUE_NAME, { durable: true });

  await channel.assertQueue(SMS_RETRY_QUEUE_NAME, {
    durable: true,
    arguments: {
      'x-message-ttl': RETRY_DELAY_MS,
      'x-dead-letter-exchange': '',
      'x-dead-letter-routing-key': SMS_QUEUE_NAME,
    },
  });

  await channel.assertQueue(SMS_DLQ_NAME, { durable: true });

  await channel.prefetch(5);

  console.log(
    `[SmsWorker] Listening on '${SMS_QUEUE_NAME}' with retry queue '${SMS_RETRY_QUEUE_NAME}' (${
      RETRY_DELAY_MS / 1000
    }s TTL) and DLQ '${SMS_DLQ_NAME}'`,
  );

  const consumerTag = (
    await channel.consume(
      SMS_QUEUE_NAME,
      async (msg: ConsumeMessage | null) => {
        if (!msg) return;

        let jobName = 'unknown';
        try {
          const content = JSON.parse(msg.content.toString());
          jobName = content.name || msg.properties?.headers?.['job-name'] || 'unknown';
          const payload = content.data || {};

          console.log(`[SmsWorker] Processing job '${jobName}'`);

          switch (jobName) {
            case 'send-otp':
              await smsService.sendOtpSms({
                to: payload.phone || payload.to,
                code: String(payload.code),
                tenant_id: payload.tenant_id,
                agent_id: payload.agent_id,
              } as OtpSmsData);
              break;

            case 'send-booking-created':
            case 'send-booking-confirmation':
              await smsService.sendBookingCreatedSms({
                to: payload.phone || payload.to,
                customer_name: payload.customer_name || payload.customerName,
                service_name: payload.service_name || payload.serviceName,
                start_time: payload.start_time || payload.startTime,
                booking_reference: payload.booking_reference || payload.bookingReference || payload.booking_id,
              } as BookingCreatedSmsData);
              break;

            case 'send-booking-cancelled':
              await smsService.sendBookingCancelledSms({
                to: payload.phone || payload.to,
                customer_name: payload.customer_name || payload.customerName,
                service_name: payload.service_name || payload.serviceName,
                start_time: payload.start_time || payload.startTime,
                booking_reference: payload.booking_reference || payload.bookingReference || payload.booking_id,
              } as BookingCancelledSmsData);
              break;

            case 'send-sms':
              await smsService.sendRawSms(
                (payload.to || payload.phone) as string,
                (payload.body || payload.message) as string,
              );
              break;

            default:
              console.warn(`[SmsWorker] Unknown job type: ${jobName}`);
          }

          channel.ack(msg);
          console.log(`[SmsWorker] Job '${jobName}' completed successfully`);
        } catch (err: any) {
          const currentRetries = Number(msg.properties?.headers?.['x-retry-count'] || 0);

          if (currentRetries < MAX_RETRY_COUNT) {
            const nextRetry = currentRetries + 1;
            console.warn(
              `[SmsWorker] Job '${jobName}' failed (attempt ${nextRetry}/${MAX_RETRY_COUNT}). Retrying in ${
                RETRY_DELAY_MS / 1000
              }s... Error: ${err.message}`,
            );

            channel.sendToQueue(SMS_RETRY_QUEUE_NAME, msg.content, {
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
          } else {
            console.error(
              `[SmsWorker] Job '${jobName}' exceeded max retries (${MAX_RETRY_COUNT}). Moved to DLQ '${SMS_DLQ_NAME}'. Error: ${err.message}`,
            );

            channel.sendToQueue(SMS_DLQ_NAME, msg.content, {
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
      },
      { noAck: false },
    )
  ).consumerTag;

  return {
    close: async () => {
      try {
        console.log('[SmsWorker] Closing RabbitMQ consumer and connection...');
        await channel.cancel(consumerTag);
        await channel.close();
        await connection.close();
        console.log('[SmsWorker] RabbitMQ connection closed gracefully.');
      } catch (err: any) {
        console.error('[SmsWorker] Error closing RabbitMQ SMS worker:', err.message);
      }
    },
  };
};
