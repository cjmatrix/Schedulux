var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { nanoid } from 'nanoid';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
let DashboardUserService = class DashboardUserService {
    dashboardUserRepo;
    cacheRepo;
    passwordHasher;
    jwtService;
    configService;
    jwtSecret;
    jwtRefreshSecret;
    constructor(dashboardUserRepo, cacheRepo, passwordHasher, jwtService, configService) {
        this.dashboardUserRepo = dashboardUserRepo;
        this.cacheRepo = cacheRepo;
        this.passwordHasher = passwordHasher;
        this.jwtService = jwtService;
        this.configService = configService;
        this.jwtSecret = this.configService.get('JWT_SECRET') || 'dev-secret-change-in-prod';
        this.jwtRefreshSecret = this.configService.get('JWT_REFRESH_SECRET') || this.jwtSecret;
    }
    async login(data) {
        if (!data.email || !data.password) {
            throw new Error('INVALID_CREDENTIALS');
        }
        const user = await this.dashboardUserRepo.findByEmail(data.email.trim().toLowerCase());
        if (!user) {
            throw new Error('INVALID_CREDENTIALS');
        }
        const isMatch = await this.passwordHasher.compare(data.password, user.password_hash);
        if (!isMatch) {
            throw new Error('INVALID_CREDENTIALS');
        }
        const accessToken = this.jwtService.sign({
            user_id: user._id.toString(),
            tenant_id: user.tenant_id,
            email: user.email,
            system_role: user.system_role,
            role: 'dashboard_user',
        }, this.jwtSecret, { expiresIn: ACCESS_TOKEN_EXPIRY });
        const tokenId = nanoid(16);
        const refreshToken = this.jwtService.sign({
            user_id: user._id.toString(),
            tenant_id: user.tenant_id,
            tokenId,
            type: 'dashboard_refresh',
        }, this.jwtRefreshSecret, { expiresIn: REFRESH_TOKEN_EXPIRY });
        await this.cacheRepo.set(`dashboard_refreshToken:${user._id.toString()}:${tokenId}`, refreshToken, { EX: REFRESH_TOKEN_TTL_SECONDS });
        return {
            message: 'Dashboard user login successful',
            user: {
                user_id: user._id.toString(),
                tenant_id: user.tenant_id,
                email: user.email,
                name: user.name,
                system_role: user.system_role,
                created_at: user.created_at ? user.created_at.toISOString() : new Date().toISOString(),
            },
            access_token: accessToken,
            refresh_token: refreshToken,
        };
    }
};
DashboardUserService = __decorate([
    Injectable(),
    __param(0, Inject('IDashboardUserRepository')),
    __param(1, Inject('ICacheRepository')),
    __param(2, Inject('IPasswordHasher')),
    __param(3, Inject('IJwtService')),
    __param(4, Inject(ConfigService)),
    __metadata("design:paramtypes", [Object, Object, Object, Object, ConfigService])
], DashboardUserService);
export { DashboardUserService };
