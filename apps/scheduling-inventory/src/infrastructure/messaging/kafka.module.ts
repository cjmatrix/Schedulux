import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SchedulingEventsProducer } from './scheduling-events.producer.js';

@Global()
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'scheduling-inventory-service',
            brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
            ssl: process.env.KAFKA_PASSWORD ? { rejectUnauthorized: false } : undefined,
            sasl: process.env.KAFKA_PASSWORD
              ? {
                  mechanism: 'scram-sha-256',
                  username: process.env.KAFKA_USERNAME || 'avnadmin',
                  password: process.env.KAFKA_PASSWORD,
                }
              : undefined,
          },
          consumer: {
            groupId: 'scheduling-consumer-group',
          },
        },
      },
    ]),
  ],
  providers: [SchedulingEventsProducer],
  exports: [ClientsModule, SchedulingEventsProducer],
})
export class KafkaModule {}
