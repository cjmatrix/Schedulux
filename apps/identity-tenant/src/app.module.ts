import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from './config/redis.js';
import { DashboardUserController } from './controllers/DashboardUserController.js';
import { SuperAdminAuthController } from './controllers/SuperAdminController.js';
import { TenantAuthController } from './controllers/TenantController.js';
import { EmailProducer } from './producers/emailProducer.js';
import { CacheRepository } from './repository/CacheRepository.js';
import { DashboardUserRepository } from './repository/DashboardUserRepository.js';
import { SuperAdminRepository } from './repository/SuperAdminRepository.js';

import { TenantRepository } from './repository/TenantRepository.js';
import { BcryptPasswordHasher } from './services/bcryptPasswordHasher.js';
import { DashboardUserService } from './services/dashboardUserService.js';
import { JwtTokenService } from './services/jwtTokenService.js';
import { SuperAdminService } from './services/superAdminService.js';
import { TenantService } from './services/tenantService.js';

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
    { provide: 'ITenantService', useClass: TenantService },
    { provide: 'ISuperAdminService', useClass: SuperAdminService },
    { provide: 'IDashboardUserService', useClass: DashboardUserService },
  ],
})
export class AppModule {}
