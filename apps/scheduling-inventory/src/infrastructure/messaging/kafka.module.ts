import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SchedulingEventsProducer } from './scheduling-events.producer.js';

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          const brokers = configService.get<string>('KAFKA_BROKERS') || process.env.KAFKA_BROKERS || 'localhost:9092';
          const username = configService.get<string>('KAFKA_USERNAME') || process.env.KAFKA_USERNAME || 'avnadmin';
          const password = configService.get<string>('KAFKA_PASSWORD') || process.env.KAFKA_PASSWORD;

          return {
            transport: Transport.KAFKA,
            options: {
              client: {
                clientId: 'scheduling-inventory-service',
                brokers: [brokers],
                ssl: password ? { rejectUnauthorized: false } : undefined,
                sasl: password
                  ? {
                      mechanism: 'scram-sha-256',
                      username,
                      password,
                    }
                  : undefined,
              },
              consumer: {
                groupId: configService.get<string>('KAFKA_CONSUMER_GROUP') || 'scheduling-consumer-group',
              },
            },
          };
        },
      },
    ]),
  ],
  providers: [SchedulingEventsProducer],
  exports: [ClientsModule, SchedulingEventsProducer],
})
export class KafkaModule {}
