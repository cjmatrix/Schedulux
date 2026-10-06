import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";

import { TenantAuthController } from "./controllers/TenantController.js";
import { SuperAdminAuthController } from "./controllers/SuperAdminController.js";
import { DashboardUserController } from "./controllers/DashboardUserController.js";
import { TenantService } from "./services/tenantService.js";
import { SuperAdminService } from "./services/superAdminService.js";
import { DashboardUserService } from "./services/dashboardUserService.js";
import { BcryptPasswordHasher } from "./services/bcryptPasswordHasher.js";
import { JwtTokenService } from "./services/jwtTokenService.js";

import { TenantRepository } from "./repository/TenantRepository.js";
import { SuperAdminRepository } from "./repository/SuperAdminRepository.js";
import { DashboardUserRepository } from "./repository/DashboardUserRepository.js";
import { CacheRepository } from "./repository/CacheRepository.js";
import { EmailProducer } from "./producers/emailProducer.js";
import { RedisModule } from "./config/redis.js";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), RedisModule],
  controllers: [TenantAuthController, SuperAdminAuthController, DashboardUserController],
  providers: [
    { provide: 'ITenantRepository', useClass: TenantRepository },
    { provide: 'IDashboardUserRepository', useClass: DashboardUserRepository },
    { provide: 'ISuperAdminRepository', useClass: SuperAdminRepository },
    { provide: 'ICacheRepository', useClass: CacheRepository },
    { provide: 'IEmailProducer', useClass: EmailProducer },
    { provide: 'IPasswordHasher', useClass: BcryptPasswordHasher },
    { provide: 'IJwtService', useClass: JwtTokenService },
    TenantService,
    SuperAdminService,
    DashboardUserService,
  ],
})
export class AppModule {}
