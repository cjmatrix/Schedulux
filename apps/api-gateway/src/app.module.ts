import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { TenantController } from './tenant/tenant.controller.js';
import { SuperAdminController } from './superadmin/superadmin.controller.js';
import { SuperAdminAuthMiddleware } from './middleware/superadmin-auth.middleware.js';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'TENANT_PACKAGE',
        transport: Transport.GRPC,
        options: {
          url: 'localhost:50051',
          package: 'tenant',
          protoPath: join(process.cwd(), 'src/grpc/proto/tenant.proto'),
          loader: {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
          }
        },
      },
      {
        name: 'SUPERADMIN_PACKAGE',
        transport: Transport.GRPC,
        options: {
          url: 'localhost:50051',
          package: 'superadmin',
          protoPath: join(process.cwd(), 'src/grpc/proto/superadmin.proto'),
          loader: {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
          }
        },
      },
    ]),
  ],
  controllers: [TenantController, SuperAdminController],
  providers: [SuperAdminAuthMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SuperAdminAuthMiddleware)
      .forRoutes(
        { path: 'api/v1/superadmin/auth/me', method: RequestMethod.GET }
      );
  }
}
