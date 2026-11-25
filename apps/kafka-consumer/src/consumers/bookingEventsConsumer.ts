import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { context, propagation, SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';
import { Consumer, Kafka, logLevel } from 'kafkajs';

export const KAFKA_SERVICE_TOPIC_BOOKINGS =
  process.env.KAFKA_BOOKING_TOPIC || 'scheduling.booking.events';
export const KAFKA_CONSUMER_GROUP_ID =
  process.env.KAFKA_CONSUMER_GROUP_ID || 'kafka-consumer-booking-events';

const tracer = trace.getTracer('kafka-consumer-booking-events', '1.0.0');

export interface BookingEventsConsumerController {
  close: () => Promise<void>;
}

export const startBookingEventsConsumer =
  async (): Promise<BookingEventsConsumerController | null> => {
    const brokersList = (process.env.KAFKA_BROKERS || 'localhost:9092')
      .split(',')
      .map((b) => b.trim())
      .filter(Boolean);

    const sqsRegion = process.env.AWS_REGION || 'ap-south-1';
    const sqsQueueUrl = process.env.AWS_SQS_SMS_QUEUE_URL || '';
    const sqsClient = new SQSClient({ region: sqsRegion });

    const kafkaPassword = process.env.KAFKA_PASSWORD;
    const kafkaUsername = process.env.KAFKA_USERNAME || 'avnadmin';

    console.log(
      `[BookingEventsConsumer] Initializing Kafka consumer on topic '${KAFKA_SERVICE_TOPIC_BOOKINGS}'...`,
    );

    let kafkaConsumer: Consumer | null = null;

    const publishSmsJob = async (
      jobName: string,
      data: Record<string, unknown>,
      traceContext?: { trace_id?: string; traceparent?: string },
    ): Promise<void> => {
      const payload = {
        name: jobName,
        data,
        trace_id: traceContext?.trace_id,
        traceparent: traceContext?.traceparent,
        timestamp: new Date().toISOString(),
      };

      if (sqsQueueUrl) {
        try {
          const messageAttributes: Record<string, { DataType: string; StringValue: string }> = {};
          if (traceContext?.traceparent) {
            messageAttributes.traceparent = {
              DataType: 'String',
              StringValue: traceContext.traceparent,
            };
          }
          if (traceContext?.trace_id) {
            messageAttributes.trace_id = {
              DataType: 'String',
              StringValue: traceContext.trace_id,
            };
          }

          await sqsClient.send(
            new SendMessageCommand({
              QueueUrl: sqsQueueUrl,
              MessageBody: JSON.stringify(payload),
              MessageAttributes:
                Object.keys(messageAttributes).length > 0 ? messageAttributes : undefined,
            }),
          );
          console.log(
            `[BookingEventsConsumer] Forwarded '${jobName}' for ${data.phone} (Ref: ${
              data.booking_reference || 'N/A'
            }, Trace: ${traceContext?.trace_id || 'N/A'}) to SQS queue`,
          );
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`[BookingEventsConsumer] Failed to publish '${jobName}' to SQS: ${msg}`);
        }
      } else {
        console.log(
          `[BookingEventsConsumer] [LOCAL DEV] AWS_SQS_SMS_QUEUE_URL not configured. Simulated '${jobName}' for ${data.phone} (Trace: ${traceContext?.trace_id || 'N/A'}):`,
          JSON.stringify(data),
        );
      }
    };

    try {
      const kafka = new Kafka({
        clientId: 'kafka-consumer-booking-events',
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

            const traceId =
              (event.trace_id as string) ||
              (message.headers?.trace_id ? message.headers.trace_id.toString() : undefined);
            const traceparent =
              (event.traceparent as string) ||
              (message.headers?.traceparent ? message.headers.traceparent.toString() : undefined);

            const carrier: Record<string, string> = {};
            if (traceparent) carrier['traceparent'] = traceparent;
            if (traceId) carrier['trace_id'] = traceId;
            if (message.headers) {
              for (const [key, val] of Object.entries(message.headers)) {
                if (val) carrier[key.toLowerCase()] = val.toString();
              }
            }

            const parentContext = propagation.extract(context.active(), carrier);

            const eventType = event.event_type || 'unknown';
            const bookingId = event.booking_id || event.data?.booking_reference || 'unknown';
            const data = event.data || {};
            const customerPhone = data.customer_phone || data.phone;

            if (!customerPhone) {
              console.log(
                `[BookingEventsConsumer] Ignoring ${eventType} for booking ${bookingId} (no phone number).`,
              );
              return;
            }

            await tracer.startActiveSpan(
              `kafka.consume ${topic} [${eventType}]`,
              {
                kind: SpanKind.CONSUMER,
                attributes: {
                  'messaging.system': 'kafka',
                  'messaging.destination.name': topic,
                  'messaging.operation': 'process',
                  'messaging.kafka.partition': partition,
                  'booking.id': String(bookingId),
                  'booking.event_type': String(eventType),
                  'tenant.id': String(event.tenant_id || ''),
                  'agent.id': String(event.agent_id || ''),
                },
              },
              parentContext,
              async (span) => {
                try {
                  const activeSpanCtx = span.spanContext();
                  const currentTraceId = activeSpanCtx.traceId || traceId;
                  const currentTraceparent = `00-${activeSpanCtx.traceId}-${activeSpanCtx.spanId}-${activeSpanCtx.traceFlags.toString(16).padStart(2, '0')}`;
                  const traceContext = {
                    trace_id: currentTraceId,
                    traceparent: currentTraceparent,
                  };

                  if (eventType === 'booking.created') {
                    await publishSmsJob(
                      'send-booking-created',
                      {
                        phone: customerPhone,
                        customer_name: data.customer_name || 'Customer',
                        service_name: data.service_name || data.service_id || 'Appointment',
                        start_time: data.start_time,
                        booking_reference: data.booking_reference || bookingId,
                        tenant_id: event.tenant_id,
                        agent_id: event.agent_id,
                      },
                      traceContext,
                    );
                  } else if (eventType === 'booking.cancelled') {
                    await publishSmsJob(
                      'send-booking-cancelled',
                      {
                        phone: customerPhone,
                        customer_name: data.customer_name || 'Customer',
                        service_name: data.service_name || data.service_id || 'Appointment',
                        start_time: data.start_time,
                        booking_reference: data.booking_reference || bookingId,
                        tenant_id: event.tenant_id,
                        agent_id: event.agent_id,
                      },
                      traceContext,
                    );
                  } else if (eventType === 'booking.rescheduled') {
                    await publishSmsJob(
                      'send-booking-rescheduled',
                      {
                        phone: customerPhone,
                        customer_name: data.customer_name || 'Customer',
                        service_name: data.service_name || data.service_id || 'Appointment',
                        new_start_time: data.start_time,
                        previous_start_time: data.previous_start_time,
                        booking_reference: data.booking_reference || bookingId,
                        tenant_id: event.tenant_id,
                        agent_id: event.agent_id,
                      },
                      traceContext,
                    );
                  } else if (
                    eventType === 'booking.completed' ||
                    (eventType === 'booking.status_updated' && data.status === 'completed')
                  ) {
                    await publishSmsJob(
                      'send-booking-completed',
                      {
                        phone: customerPhone,
                        customer_name: data.customer_name || 'Customer',
                        service_name: data.service_name || data.service_id || 'Appointment',
                        booking_reference: data.booking_reference || bookingId,
                        tenant_id: event.tenant_id,
                        agent_id: event.agent_id,
                      },
                      traceContext,
                    );
                  }

                  span.setStatus({ code: SpanStatusCode.OK });
                } catch (err: unknown) {
                  const errorMsg = err instanceof Error ? err.message : String(err);
                  span.setStatus({ code: SpanStatusCode.ERROR, message: errorMsg });
                  if (err instanceof Error) {
                    span.recordException(err);
                  }
                  throw err;
                } finally {
                  span.end();
                }
              },
            );
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error(
              `[BookingEventsConsumer] Error processing Kafka booking message: ${msg}`,
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
            sqsClient.destroy();
            console.log('[BookingEventsConsumer] Kafka consumer closed.');
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error('[BookingEventsConsumer] Error closing consumer:', msg);
          }
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(
        `[BookingEventsConsumer] Could not connect to Kafka (${msg}).`,
      );
      sqsClient.destroy();
      return null;
    }
  };
