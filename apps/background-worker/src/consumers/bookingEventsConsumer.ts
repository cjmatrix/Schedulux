import amqp, { Channel, ChannelModel } from 'amqplib';
import { Consumer, Kafka, logLevel } from 'kafkajs';
import { SMS_QUEUE_NAME } from '../workers/smsWorker.js';

export const KAFKA_SERVICE_TOPIC_BOOKINGS =
  process.env.KAFKA_BOOKING_TOPIC || 'scheduling.booking.events';
export const KAFKA_CONSUMER_GROUP_ID =
  process.env.KAFKA_CONSUMER_GROUP_ID || 'background-worker-booking-events';

export interface BookingEventsConsumerController {
  close: () => Promise<void>;
}

export const startBookingEventsConsumer =
  async (): Promise<BookingEventsConsumerController | null> => {
    const brokersList = (process.env.KAFKA_BROKERS || 'localhost:9092')
      .split(',')
      .map((b) => b.trim())
      .filter(Boolean);

    const rabbitUri = process.env.RABBITMQ_URI || 'amqp://localhost:5672';
    const kafkaPassword = process.env.KAFKA_PASSWORD;
    const kafkaUsername = process.env.KAFKA_USERNAME || 'avnadmin';

    console.log(
      `[BookingEventsConsumer] Initializing Kafka consumer on topic '${KAFKA_SERVICE_TOPIC_BOOKINGS}'...`,
    );

    let rabbitConn: ChannelModel | null = null;
    let rabbitChannel: Channel | null = null;
    let kafkaConsumer: Consumer | null = null;

    try {
  
      rabbitConn = await amqp.connect(rabbitUri);
      rabbitChannel = await rabbitConn.createChannel();
      await rabbitChannel.assertQueue(SMS_QUEUE_NAME, { durable: true });

      const kafka = new Kafka({
        clientId: 'background-worker-booking-events',
        brokers: brokersList,
        ssl: kafkaPassword ? { rejectUnauthorized: false } : undefined,
        sasl: kafkaPassword
          ? {
              mechanism: 'scram-sha-256',
              username: kafkaUsername,
              password: kafkaPassword,
            }
          : undefined,
        logLevel: logLevel.WARN,
      });

      kafkaConsumer = kafka.consumer({ groupId: KAFKA_CONSUMER_GROUP_ID });
      await kafkaConsumer.connect();
      await kafkaConsumer.subscribe({
        topic: KAFKA_SERVICE_TOPIC_BOOKINGS,
        fromBeginning: false,
      });

      console.log(
        `[BookingEventsConsumer] Subscribed to Kafka topic '${KAFKA_SERVICE_TOPIC_BOOKINGS}' (group: '${KAFKA_CONSUMER_GROUP_ID}')`,
      );

    
      await kafkaConsumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          if (!message.value) return;

          try {
            const raw = message.value.toString();
            const event = JSON.parse(raw);

            const eventType = event.event_type;
            const bookingId = event.booking_id;
            const data = event.data || {};
            const customerPhone = data.customer_phone || data.phone;

            if (!customerPhone) {
              console.log(
                `[BookingEventsConsumer] Ignoring ${eventType} for booking ${bookingId} (no phone number).`,
              );
              return;
            }

            if (eventType === 'booking.created') {
              const smsJobPayload = {
                name: 'send-booking-created',
                data: {
                  phone: customerPhone,
                  customer_name: data.customer_name || 'Customer',
                  service_name: data.service_name || data.service_id || 'Appointment',
                  start_time: data.start_time,
                  booking_reference: data.booking_reference || bookingId,
                  tenant_id: event.tenant_id,
                  agent_id: event.agent_id,
                },
              };

              rabbitChannel?.sendToQueue(
                SMS_QUEUE_NAME,
                Buffer.from(JSON.stringify(smsJobPayload)),
                { persistent: true },
              );

              console.log(
                `[BookingEventsConsumer] Forwarded 'booking.created' for ${customerPhone} (Ref: ${
                  data.booking_reference || bookingId
                }) to RabbitMQ '${SMS_QUEUE_NAME}'`,
              );
            } else if (eventType === 'booking.cancelled') {
              const smsJobPayload = {
                name: 'send-booking-cancelled',
                data: {
                  phone: customerPhone,
                  customer_name: data.customer_name || 'Customer',
                  service_name: data.service_name || data.service_id || 'Appointment',
                  start_time: data.start_time,
                  booking_reference: data.booking_reference || bookingId,
                  tenant_id: event.tenant_id,
                  agent_id: event.agent_id,
                },
              };

              rabbitChannel?.sendToQueue(
                SMS_QUEUE_NAME,
                Buffer.from(JSON.stringify(smsJobPayload)),
                { persistent: true },
              );

              console.log(
                `[BookingEventsConsumer] Forwarded 'booking.cancelled' for ${customerPhone} (Ref: ${
                  data.booking_reference || bookingId
                }) to RabbitMQ '${SMS_QUEUE_NAME}'`,
              );
            }
          } catch (err: any) {
            console.error(
              `[BookingEventsConsumer] Error processing Kafka booking message: ${err.message}`,
            );
          }
        },
      });

      return {
        close: async () => {
          try {
            console.log('[BookingEventsConsumer] Disconnecting Kafka consumer...');
            if (kafkaConsumer) {
              await kafkaConsumer.disconnect();
            }
            if (rabbitChannel) {
              await rabbitChannel.close();
            }
            if (rabbitConn) {
              await rabbitConn.close();
            }
            console.log('[BookingEventsConsumer] Kafka consumer closed.');
          } catch (err: any) {
            console.error('[BookingEventsConsumer] Error closing consumer:', err.message);
          }
        },
      };
    } catch (err: any) {
      console.warn(
        `[BookingEventsConsumer] Could not connect to Kafka (${err.message}). Background worker will continue with RabbitMQ workers only.`,
      );
      if (rabbitChannel) {
        try {
          await rabbitChannel.close();
        } catch {}
      }
      if (rabbitConn) {
        try {
          await rabbitConn.close();
        } catch {}
      }
      return null;
    }
  };
