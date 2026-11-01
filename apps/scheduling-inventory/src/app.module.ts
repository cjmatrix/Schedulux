import { createRequire } from 'node:module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { RedisModule } from './infrastructure/cache/redis.module.js';
import { KafkaModule } from './infrastructure/messaging/kafka.module.js';
import { BookingModule } from './modules/booking.module.js';
import { InventoryModule } from './modules/inventory.module.js';
import { ResourceModule } from './modules/resource.module.js';
import { ServiceModule } from './modules/service.module.js';
import { SchedulingInventoryGrpcController } from './presentation/grpc/scheduling-inventory.grpc.controller.js';

const require = createRequire(import.meta.url);
const isProduction = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        name: 'scheduling-inventory',
        level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
        transport: isProduction
          ? undefined
          : {
              target: require.resolve('pino-pretty'),
              options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
              },
            },
      },
      microservice: true,
    }),
    RedisModule,
    KafkaModule,
    ServiceModule,
    ResourceModule,
    InventoryModule,
    BookingModule,
  ],
  controllers: [SchedulingInventoryGrpcController],
})
export class AppModule {}
