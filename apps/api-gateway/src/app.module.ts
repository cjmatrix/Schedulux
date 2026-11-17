import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { KnowledgeController } from './controllers/agentOrchestrator/knowledge.controller.js';
import { BillingController } from './controllers/billing/billing.controller.js';
import { DashboardUserAuthController } from './controllers/dashboarduser/dashboard-user-auth.controller.js';
import { SchedulingController } from './controllers/scheduling/scheduling.controller.js';
import { SuperAdminController } from './controllers/superadmin/superadmin.controller.js';
import { SuperAdminDashboardController } from './controllers/superadmin/superadmin-dashboard.controller.js';
import { SuperAdminTenantController } from './controllers/superadmin/superadmin-tenant.controller.js';
import { SuperAdminTierConfigController } from './controllers/superadmin/superadmin-tier-config.controller.js';
import { TenantController } from './controllers/tenant/tenant.controller.js';
import { TenantDashboardController } from './controllers/tenant/tenant-dashboard.controller.js';
import { AppThrottlerGuard } from './guards/app-throttler.guard.js';
import { PaddleWebhookGuard } from './guards/paddle-webhook.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { TenantAuthGuard } from './guards/tenant-auth.guard.js';
import { RedisModule } from './modules/redis.module.js';
import { ThrottlerStorageRedisService } from './services/throttler-storage-redis.service.js';
import { SchemaGateway } from './websockets/schema.gateway.js';

const isProduction = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        name: 'api-gateway',
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
    }),
    RedisModule,
    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: [ThrottlerStorageRedisService],
      useFactory: (storage: ThrottlerStorageRedisService) => ({
        throttlers: [
          {
            name: 'short',
            ttl: 1000,
            limit: 30,
          },
          {
            name: 'default',
            ttl: 60000,
            limit: 100,
          },
          {
            name: 'long',
            ttl: 900000,
            limit: 1000,
          },
        ],
        storage,
        errorMessage: (_context, detail) =>
          `Rate limit of ${detail.limit} requests exceeded. Please try again in ${detail.timeToBlockExpire} seconds.`,
      }),
    }),
    ClientsModule.register([
      {
        name: 'TENANT_PACKAGE',
        transport: Transport.GRPC,
        options: {
          url: 'localhost:50051',
          package: 'tenant',
          protoPath: require.resolve('@repo/proto/tenant.proto'),
          loader: {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
          },
        },
      },
      {
        name: 'DASHBOARD_PACKAGE',
        transport: Transport.GRPC,
        options: {
          url: 'localhost:50051',
          package: 'dashboard',
          protoPath: require.resolve('@repo/proto/dashboard.proto'),
          loader: {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
          },
        },
      },
      {
        name: 'SUPERADMIN_PACKAGE',
        transport: Transport.GRPC,
        options: {
          url: 'localhost:50051',
          package: 'superadmin',
          protoPath: require.resolve('@repo/proto/superadmin.proto'),
          loader: {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
          },
        },
      },
      {
        name: 'KNOWLEDGE_PACKAGE',
        transport: Transport.GRPC,
        options: {
          url: 'localhost:50052',
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
      {
        name: 'SCHEDULING_PACKAGE',
        transport: Transport.GRPC,
        options: {
          url: 'localhost:50053',
          package: 'scheduling',
          protoPath: require.resolve('@repo/proto/scheduling.proto'),
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
  controllers: [
    TenantController,
    TenantDashboardController,
    BillingController,
    SuperAdminController,
    SuperAdminDashboardController,
    SuperAdminTenantController,
    SuperAdminTierConfigController,
    DashboardUserAuthController,
    KnowledgeController,
    SchedulingController,
  ],
  providers: [
    SchemaGateway,
    RolesGuard,
    TenantAuthGuard,
    PaddleWebhookGuard,
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
  ],
})
export class AppModule {}
