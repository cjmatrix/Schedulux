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
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days in seconds
let SuperAdminService = class SuperAdminService {
    superAdminRepo;
    cacheRepo;
    tenantRepo;
    passwordHasher;
    jwtService;
    configService;
    jwtSecret;
    jwtRefreshSecret;
    constructor(superAdminRepo, cacheRepo, tenantRepo, passwordHasher, jwtService, configService) {
        this.superAdminRepo = superAdminRepo;
        this.cacheRepo = cacheRepo;
        this.tenantRepo = tenantRepo;
        this.passwordHasher = passwordHasher;
        this.jwtService = jwtService;
        this.configService = configService;
        const globalSecret = this.configService.get('JWT_SECRET');
        const globalRefreshSecret = this.configService.get('JWT_REFRESH_SECRET');
        this.jwtSecret = this.configService.get('SUPERADMIN_JWT_SECRET') ||
            (globalSecret ? `${globalSecret}_superadmin` : 'superadmin_access_secret_2025');
        this.jwtRefreshSecret = this.configService.get('SUPERADMIN_JWT_REFRESH_SECRET') ||
            (globalRefreshSecret ? `${globalRefreshSecret}_superadmin` : 'superadmin_refresh_secret_2025');
    }
    async login(email, password) {
        const admin = await this.superAdminRepo.findByEmail(email.toLowerCase().trim());
        if (!admin) {
            throw new Error('INVALID_CREDENTIALS');
        }
        const isMatch = await this.passwordHasher.compare(password, admin.password_hash);
        if (!isMatch) {
            throw new Error('INVALID_CREDENTIALS');
        }
        const adminId = admin._id.toString();
        const tokenId = nanoid(16);
        const accessToken = this.jwtService.sign({
            super_admin_id: adminId,
            email: admin.email,
            name: admin.name,
            role: admin.role,
        }, this.jwtSecret, { expiresIn: ACCESS_TOKEN_EXPIRY });
        const refreshToken = this.jwtService.sign({
            super_admin_id: adminId,
            token_id: tokenId,
            role: admin.role,
        }, this.jwtRefreshSecret, { expiresIn: REFRESH_TOKEN_EXPIRY });
        await this.cacheRepo.set(`superadmin_refresh_token:${adminId}:${tokenId}`, refreshToken, { EX: REFRESH_TOKEN_TTL_SECONDS });
        return {
            accessToken,
            refreshToken,
            superAdmin: {
                id: adminId,
                email: admin.email,
                name: admin.name,
                role: admin.role,
                created_at: admin.created_at,
            },
        };
    }
    async refreshToken(incomingRefreshToken) {
        let payload;
        try {
            payload = this.jwtService.verify(incomingRefreshToken, this.jwtRefreshSecret);
        }
        catch {
            throw new Error('INVALID_OR_EXPIRED_REFRESH_TOKEN');
        }
        if (!payload?.super_admin_id || !payload?.token_id) {
            throw new Error('INVALID_OR_EXPIRED_REFRESH_TOKEN');
        }
        const sessionKey = `superadmin_refresh_token:${payload.super_admin_id}:${payload.token_id}`;
        const storedToken = await this.cacheRepo.get(sessionKey);
        if (!storedToken || storedToken !== incomingRefreshToken) {
            if (storedToken) {
                await this.cacheRepo.delete(sessionKey);
            }
            throw new Error('INVALID_OR_REVOKED_REFRESH_TOKEN');
        }
        await this.cacheRepo.delete(sessionKey);
        const admin = await this.superAdminRepo.findById(payload.super_admin_id);
        if (!admin) {
            throw new Error('SUPERADMIN_NOT_FOUND');
        }
        const adminId = admin._id.toString();
        const nextTokenId = nanoid(16);
        const newAccessToken = this.jwtService.sign({
            super_admin_id: adminId,
            email: admin.email,
            name: admin.name,
            role: admin.role,
        }, this.jwtSecret, { expiresIn: ACCESS_TOKEN_EXPIRY });
        const newRefreshToken = this.jwtService.sign({
            super_admin_id: adminId,
            token_id: nextTokenId,
            role: admin.role,
        }, this.jwtRefreshSecret, { expiresIn: REFRESH_TOKEN_EXPIRY });
        await this.cacheRepo.set(`superadmin_refresh_token:${adminId}:${nextTokenId}`, newRefreshToken, { EX: REFRESH_TOKEN_TTL_SECONDS });
        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            superAdmin: {
                id: adminId,
                email: admin.email,
                name: admin.name,
                role: admin.role,
            },
        };
    }
    async logout(incomingRefreshToken) {
        if (!incomingRefreshToken)
            return;
        try {
            const payload = this.jwtService.verify(incomingRefreshToken, this.jwtRefreshSecret);
            if (payload?.super_admin_id && payload?.token_id) {
                await this.cacheRepo.delete(`superadmin_refresh_token:${payload.super_admin_id}:${payload.token_id}`);
            }
        }
        catch {
        }
    }
    async createSuperAdmin(data) {
        const existing = await this.superAdminRepo.findByEmail(data.email.toLowerCase().trim());
        if (existing) {
            throw new Error('SUPERADMIN_ALREADY_EXISTS');
        }
        const password_hash = await this.passwordHasher.hash(data.password, 10);
        const admin = await this.superAdminRepo.create({
            email: data.email.toLowerCase().trim(),
            password_hash,
            name: data.name.trim(),
            role: 'super_admin',
        });
        return {
            id: admin._id.toString(),
            email: admin.email,
            name: admin.name,
            role: admin.role,
            created_at: admin.created_at,
        };
    }
    async getProfile(adminId) {
        const admin = await this.superAdminRepo.findById(adminId);
        if (!admin) {
            throw new Error('SUPERADMIN_NOT_FOUND');
        }
        return {
            id: admin._id.toString(),
            email: admin.email,
            name: admin.name,
            role: admin.role,
            created_at: admin.created_at,
        };
    }
    async ListTenants(data) {
        return this.tenantRepo.listTenants(data);
    }
    async suspendTenant(tenantId) {
        const tenant = await this.tenantRepo.findByTenantId(tenantId);
        if (!tenant) {
            throw new Error('TENANT_NOT_FOUND');
        }
        const nextStatus = tenant.status === 'suspended' ? 'active' : 'suspended';
        const updated = await this.tenantRepo.updateStatus(tenantId, nextStatus);
        if (!updated) {
            throw new Error('FAILED_TO_UPDATE_TENANT_STATUS');
        }
        return {
            message: `Tenant ${nextStatus === 'active' ? 'reactivated' : 'suspended'} successfully`,
            tenant: {
                tenant_id: updated._id.toString(),
                business_name: updated.business_name,
                contact_email: updated.contact_email,
                tier: updated.tier,
                status: updated.status,
            },
        };
    }
};
SuperAdminService = __decorate([
    Injectable(),
    __param(0, Inject('ISuperAdminRepository')),
    __param(1, Inject('ICacheRepository')),
    __param(2, Inject('ITenantRepository')),
    __param(3, Inject('IPasswordHasher')),
    __param(4, Inject('IJwtService')),
    __param(5, Inject(ConfigService)),
    __metadata("design:paramtypes", [Object, Object, Object, Object, Object, ConfigService])
], SuperAdminService);
export { SuperAdminService };
