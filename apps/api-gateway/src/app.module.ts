import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CustomerChatController } from './controllers/agentOrchestrator/customer-chat.controller.js';
import { KnowledgeController } from './controllers/agentOrchestrator/knowledge.controller.js';
import { DashboardUserAuthController } from './controllers/dashboarduser/dashboard-user-auth.controller.js';
import { SchedulingController } from './controllers/scheduling/scheduling.controller.js';
import { SuperAdminController } from './controllers/superadmin/superadmin.controller.js';
import { SuperAdminTenantController } from './controllers/superadmin/superadmin-tenant.controller.js';
import { TenantController } from './controllers/tenant/tenant.controller.js';
import { RolesGuard } from './guards/roles.guard.js';
import { TenantAuthGuard } from './guards/tenant-auth.guard.js';
import { RedisService } from './services/redis.service.js';
import { SchemaGateway } from './websockets/schema.gateway.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
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
    SuperAdminController,
    SuperAdminTenantController,
    DashboardUserAuthController,
    KnowledgeController,
    CustomerChatController,
    SchedulingController,
  ],
  providers: [
    RedisService,
    {
      provide: 'ISchemaEventSubscriber',
      useExisting: RedisService,
    },
    {
      provide: 'ISchemaCacheService',
      useExisting: RedisService,
    },
    SchemaGateway,
    RolesGuard,
    TenantAuthGuard,
  ],
})
export class AppModule {}
