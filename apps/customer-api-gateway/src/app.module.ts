import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CustomerChatController } from './controllers/customer-chat.controller.js';
import { CorsOriginGuard } from './guards/cors-origin.guard.js';
import { RedisService } from './services/redis.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ClientsModule.register([
      {
        name: 'KNOWLEDGE_PACKAGE',
        transport: Transport.GRPC,
        options: {
          url: process.env.KNOWLEDGE_GRPC_URL || 'localhost:50052',
          package: 'knowledge',
          protoPath: require.resolve('@repo/proto/knowledge.proto'),
          loader: {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
          },
        },
      },
    ]),
  ],
  controllers: [CustomerChatController],
  providers: [CorsOriginGuard, RedisService],
  exports: [RedisService],
})
export class AppModule {}

