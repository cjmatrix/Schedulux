var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TenantAuthController } from './auth/TenantAuthController.js';
import { SuperAdminAuthController } from './auth/SuperAdminAuthController.js';
import { TenantService } from '../services/tenantService.js';
import { SuperAdminService } from '../services/superAdminService.js';
import { TenantRepository } from '../repository/TenantRepository.js';
import { SuperAdminRepository } from '../repository/SuperAdminRepository.js';
import { CacheRepository } from '../repository/CacheRepository.js';
import { emailProducer } from '../producers/emailProducer.js';
import { redisClient } from '../config/redis.js';
let AppModule = class AppModule {
};
AppModule = __decorate([
    Module({
        imports: [
            ConfigModule.forRoot({ isGlobal: true }),
        ],
        controllers: [TenantAuthController, SuperAdminAuthController],
        providers: [
            TenantRepository,
            SuperAdminRepository,
            {
                provide: 'REDIS_CLIENT',
                useValue: redisClient,
            },
            CacheRepository,
            {
                provide: 'EMAIL_PRODUCER',
                useValue: emailProducer,
            },
            TenantService,
            SuperAdminService,
        ],
    })
], AppModule);
export { AppModule };
