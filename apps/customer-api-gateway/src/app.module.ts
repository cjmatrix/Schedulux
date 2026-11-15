import { ExecutionContext, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ThrottlerModule } from '@nestjs/throttler';
import { CustomerChatController } from './controllers/customer-chat.controller.js';
import { CorsOriginGuard } from './guards/cors-origin.guard.js';
import { CustomerThrottlerGuard } from './guards/customer-throttler.guard.js';
import { RedisModule } from './modules/redis.module.js';
import { RedisService } from './services/redis.service.js';
import { ThrottlerStorageRedisService } from './services/throttler-storage-redis.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RedisModule,
    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: [ThrottlerStorageRedisService, RedisService],
      useFactory: (
        storage: ThrottlerStorageRedisService,
        redisService: RedisService,
      ) => ({
        throttlers: [
          {
            name: 'short',
            ttl: 1000,
            limit: 20,
          },
          {
            name: 'default',
            ttl: 60000,
            limit: async (context: ExecutionContext) => {
              const req = context.switchToHttp().getRequest();
              const tenantId =
                req.body?.tenant_id ||
                req.query?.tenant_id ||
                req.headers?.['x-tenant-id'];

              if (tenantId && typeof tenantId === 'string' && tenantId.trim().length > 0) {
                return await redisService.getTierRateLimit(tenantId.trim());
              }

              return 60;
            },
          },
          {
            name: 'long',
            ttl: 900000,
            limit: 1000,
          },
        ],
        storage,
        errorMessage: (_context, detail) =>
          `Rate limit of ${detail.limit} requests per minute exceeded for this tenant. Please try again in ${detail.timeToBlockExpire} seconds.`,
      }),
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
  providers: [
    CorsOriginGuard,
    {
      provide: APP_GUARD,
      useClass: CustomerThrottlerGuard,
    },
  ],
})
export class AppModule {}

