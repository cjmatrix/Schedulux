import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServiceModule } from './modules/service.module.js';
import { ResourceModule } from './modules/resource.module.js';
import { SchedulingInventoryGrpcController } from './presentation/grpc/scheduling-inventory.grpc.controller.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServiceModule,
    ResourceModule,
  ],
  controllers: [SchedulingInventoryGrpcController],
})
export class AppModule {}
