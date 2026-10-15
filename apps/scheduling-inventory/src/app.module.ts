import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { KafkaModule } from './infrastructure/messaging/kafka.module.js';
import { ServiceModule } from './modules/service.module.js';
import { ResourceModule } from './modules/resource.module.js';
import { InventoryModule } from './modules/inventory.module.js';
import { SchedulingInventoryGrpcController } from './presentation/grpc/scheduling-inventory.grpc.controller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localEnvPath = path.resolve(__dirname, '../.env');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [localEnvPath, '.env'],
    }),
    KafkaModule,
    ServiceModule,
    ResourceModule,
    InventoryModule,
  ],
  controllers: [SchedulingInventoryGrpcController],
})
export class AppModule {}
