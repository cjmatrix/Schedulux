var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { createRequire } from 'node:module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
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
const require = createRequire(import.meta.url);
const isProduction = process.env.NODE_ENV === 'production';
let AppModule = class AppModule {
};
AppModule = __decorate([
    Module({
        imports: [
            ConfigModule.forRoot({ isGlobal: true }),
            LoggerModule.forRoot({
                pinoHttp: {
                    name: 'identity-tenant',
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
                microservice: true,
            }),
            RedisModule,
        ],
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
], AppModule);
export { AppModule };
