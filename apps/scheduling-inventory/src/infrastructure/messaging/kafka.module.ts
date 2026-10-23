import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  MESSAGING_SERVICE,
  OUTBOX_REPOSITORY,
  SCHEDULING_EVENTS_PRODUCER,
  UNIT_OF_WORK,
} from '../../domain/tokens.js';
import { OutboxRepository } from '../database/repositories/outbox.repository.js';
import { UnitOfWork } from '../database/unit-of-work.js';
import { OutboxRecoveryService } from './outbox-recovery.service.js';
import { SchedulingEventsProducer } from './scheduling-events.producer.js';

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: MESSAGING_SERVICE,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          const brokers =
            configService.get<string>('KAFKA_BROKERS') ||
            process.env.KAFKA_BROKERS ||
            'localhost:9092';
          const username =
            configService.get<string>('KAFKA_USERNAME') || process.env.KAFKA_USERNAME || 'avnadmin';
          const password =
            configService.get<string>('KAFKA_PASSWORD') || process.env.KAFKA_PASSWORD;

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
                groupId:
                  configService.get<string>('KAFKA_CONSUMER_GROUP') || 'scheduling-consumer-group',
              },
            },
          };
        },
      },
    ]),
  ],
  providers: [
    { provide: UNIT_OF_WORK, useClass: UnitOfWork },
    { provide: OUTBOX_REPOSITORY, useClass: OutboxRepository },
    { provide: SCHEDULING_EVENTS_PRODUCER, useClass: SchedulingEventsProducer },
    OutboxRecoveryService,
  ],
  exports: [UNIT_OF_WORK, OUTBOX_REPOSITORY, SCHEDULING_EVENTS_PRODUCER],
})
export class KafkaModule {}
