import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaModule } from './infrastructure/messaging/kafka.module.js';
import { ServiceModule } from './modules/service.module.js';
import { ResourceModule } from './modules/resource.module.js';
import { InventoryModule } from './modules/inventory.module.js';
import { SchedulingInventoryGrpcController } from './presentation/grpc/scheduling-inventory.grpc.controller.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    KafkaModule,
    ServiceModule,
    ResourceModule,
    InventoryModule,
  ],
  controllers: [SchedulingInventoryGrpcController],
})
export class AppModule {}
