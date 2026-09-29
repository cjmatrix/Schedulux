import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";

import { TenantAuthController } from "./auth/TenantAuthController.js";
import { SuperAdminAuthController } from "./auth/SuperAdminAuthController.js";
import { TenantService } from "./services/tenantService.js";
import { SuperAdminService } from "./services/superAdminService.js";

import { TenantRepository } from "./repository/TenantRepository.js";
import { SuperAdminRepository } from "./repository/SuperAdminRepository.js";
import { CacheRepository } from "./repository/CacheRepository.js";
import { EmailProducer } from "./producers/emailProducer.js";
import { RedisModule } from "./config/redis.js";
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), RedisModule],
  controllers: [TenantAuthController, SuperAdminAuthController],
  providers: [
    { provide: 'ITenantRepository', useClass: TenantRepository },
    { provide: 'ISuperAdminRepository', useClass: SuperAdminRepository },
    { provide: 'ICacheRepository', useClass: CacheRepository },
    { provide: 'IEmailProducer', useClass: EmailProducer },
    TenantService,
    SuperAdminService,
  ],
})
export class AppModule {}
