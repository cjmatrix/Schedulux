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
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { nanoid } from 'nanoid';
import { RESPONSE_MESSAGES } from '../constants/messages.constant.js';
let SuperAdminService = class SuperAdminService {
    _superAdminRepo;
    _cacheRepo;
    _tenantRepo;
    _passwordHasher;
    _jwtService;
    _configService;
    _jwtSecret;
    _jwtRefreshSecret;
    _accessTokenExpiry;
    _refreshTokenExpiry;
    _refreshTokenTtlSeconds;
    constructor(_superAdminRepo, _cacheRepo, _tenantRepo, _passwordHasher, _jwtService, _configService) {
        this._superAdminRepo = _superAdminRepo;
        this._cacheRepo = _cacheRepo;
        this._tenantRepo = _tenantRepo;
        this._passwordHasher = _passwordHasher;
        this._jwtService = _jwtService;
        this._configService = _configService;
        const globalSecret = this._configService.get('JWT_SECRET');
        const globalRefreshSecret = this._configService.get('JWT_REFRESH_SECRET');
        this._jwtSecret =
            this._configService.get('SUPERADMIN_JWT_SECRET') ||
                (globalSecret ? `${globalSecret}_superadmin` : 'superadmin_access_secret_2025');
        this._jwtRefreshSecret =
            this._configService.get('SUPERADMIN_JWT_REFRESH_SECRET') ||
                (globalRefreshSecret
                    ? `${globalRefreshSecret}_superadmin`
                    : 'superadmin_refresh_secret_2025');
        this._accessTokenExpiry = (this._configService.get('ACCESS_TOKEN_EXPIRY') ||
            '15m');
        this._refreshTokenExpiry = (this._configService.get('REFRESH_TOKEN_EXPIRY') ||
            '7d');
        this._refreshTokenTtlSeconds =
            parseInt(this._configService.get('REFRESH_TOKEN_TTL_SECONDS') || '', 10) ||
                7 * 24 * 60 * 60;
    }
    async login(email, password) {
        const admin = await this._superAdminRepo.findByEmail(email.toLowerCase().trim());
        if (!admin) {
            throw new Error(RESPONSE_MESSAGES.ERRORS.INVALID_CREDENTIALS);
        }
        const isMatch = await this._passwordHasher.compare(password, admin.password_hash);
        if (!isMatch) {
            throw new Error(RESPONSE_MESSAGES.ERRORS.INVALID_CREDENTIALS);
        }
        const adminId = admin._id.toString();
        const tokenId = nanoid(16);
        const accessToken = this._jwtService.sign({
            super_admin_id: adminId,
            email: admin.email,
            name: admin.name,
            role: admin.role,
        }, this._jwtSecret, { expiresIn: this._accessTokenExpiry });
        const refreshToken = this._jwtService.sign({
            super_admin_id: adminId,
            token_id: tokenId,
            role: admin.role,
        }, this._jwtRefreshSecret, { expiresIn: this._refreshTokenExpiry });
        await this._cacheRepo.set(`superadmin_refresh_token:${adminId}:${tokenId}`, refreshToken, {
            EX: this._refreshTokenTtlSeconds,
        });
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
            payload = this._jwtService.verify(incomingRefreshToken, this._jwtRefreshSecret);
        }
        catch {
            throw new Error(RESPONSE_MESSAGES.ERRORS.INVALID_OR_EXPIRED_REFRESH_TOKEN);
        }
        if (!payload?.super_admin_id || !payload?.token_id) {
            throw new Error(RESPONSE_MESSAGES.ERRORS.INVALID_OR_EXPIRED_REFRESH_TOKEN);
        }
        const sessionKey = `superadmin_refresh_token:${payload.super_admin_id}:${payload.token_id}`;
        const storedToken = await this._cacheRepo.get(sessionKey);
        if (!storedToken || storedToken !== incomingRefreshToken) {
            if (storedToken) {
                await this._cacheRepo.delete(sessionKey);
            }
            throw new Error(RESPONSE_MESSAGES.ERRORS.INVALID_OR_REVOKED_REFRESH_TOKEN);
        }
        await this._cacheRepo.delete(sessionKey);
        const admin = await this._superAdminRepo.findById(payload.super_admin_id);
        if (!admin) {
            throw new Error(RESPONSE_MESSAGES.ERRORS.SUPERADMIN_NOT_FOUND);
        }
        const adminId = admin._id.toString();
        const nextTokenId = nanoid(16);
        const newAccessToken = this._jwtService.sign({
            super_admin_id: adminId,
            email: admin.email,
            name: admin.name,
            role: admin.role,
        }, this._jwtSecret, { expiresIn: this._accessTokenExpiry });
        const newRefreshToken = this._jwtService.sign({
            super_admin_id: adminId,
            token_id: nextTokenId,
            role: admin.role,
        }, this._jwtRefreshSecret, { expiresIn: this._refreshTokenExpiry });
        await this._cacheRepo.set(`superadmin_refresh_token:${adminId}:${nextTokenId}`, newRefreshToken, { EX: this._refreshTokenTtlSeconds });
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
            const payload = this._jwtService.verify(incomingRefreshToken, this._jwtRefreshSecret);
            if (payload?.super_admin_id && payload?.token_id) {
                await this._cacheRepo.delete(`superadmin_refresh_token:${payload.super_admin_id}:${payload.token_id}`);
            }
        }
        catch { }
    }
    async createSuperAdmin(data) {
        const existing = await this._superAdminRepo.findByEmail(data.email.toLowerCase().trim());
        if (existing) {
            throw new Error(RESPONSE_MESSAGES.ERRORS.SUPERADMIN_ALREADY_EXISTS);
        }
        const password_hash = await this._passwordHasher.hash(data.password, 10);
        const admin = await this._superAdminRepo.create({
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
        const admin = await this._superAdminRepo.findById(adminId);
        if (!admin) {
            throw new Error(RESPONSE_MESSAGES.ERRORS.SUPERADMIN_NOT_FOUND);
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
        return this._tenantRepo.listTenants(data);
    }
    async suspendTenant(tenantId) {
        const tenant = await this._tenantRepo.findByTenantId(tenantId);
        if (!tenant) {
            throw new Error(RESPONSE_MESSAGES.ERRORS.TENANT_NOT_FOUND);
        }
        const nextStatus = tenant.status === 'suspended' ? 'active' : 'suspended';
        const updated = await this._tenantRepo.updateStatus(tenantId, nextStatus);
        if (!updated) {
            throw new Error(RESPONSE_MESSAGES.ERRORS.FAILED_TO_UPDATE_TENANT_STATUS);
        }
        return {
            message: RESPONSE_MESSAGES.AUTH.TENANT_STATUS_UPDATED(nextStatus),
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
