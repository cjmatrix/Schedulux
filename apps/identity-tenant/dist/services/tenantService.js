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
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { TenantRepository } from '../repository/TenantRepository.js';
import { CacheRepository } from '../repository/CacheRepository.js';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
let TenantService = class TenantService {
    tenantRepo;
    cacheRepo;
    configService;
    emailProducer;
    jwtSecret;
    jwtRefreshSecret;
    constructor(tenantRepo, cacheRepo, configService, emailProducer) {
        this.tenantRepo = tenantRepo;
        this.cacheRepo = cacheRepo;
        this.configService = configService;
        this.emailProducer = emailProducer;
        this.jwtSecret = this.configService.get('JWT_SECRET') || 'dev-secret-change-in-prod';
        this.jwtRefreshSecret = this.configService.get('JWT_REFRESH_SECRET') || this.jwtSecret;
    }
    async register(data) {
        const existingUser = await this.tenantRepo.findByEmail(data.email);
        if (existingUser) {
            throw new Error('EMAIL_ALREADY_EXISTS');
        }
        const tenantId = `tnt_${nanoid(21)}`;
        const passwordHash = await bcrypt.hash(data.password, 12);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        await this.cacheRepo.set(`tenant_verificationToken:${verificationToken}`, tenantId, { EX: 3600 });
        const tenant = await this.tenantRepo.create({
            _id: tenantId,
            business_name: data.business_name,
            contact_email: data.email,
            password_hash: passwordHash,
            tier: 'starter',
            status: 'pending'
        });
        if (this.emailProducer) {
            await this.emailProducer.sendVerificationEmail({
                to: data.email,
                business_name: data.business_name,
                full_name: data.full_name,
                tenant_id: tenantId,
                verification_token: verificationToken,
            });
        }
        return {
            tenant_id: tenant._id,
            message: 'Registration successful. Please check your email to verify your account.',
            verification_token: verificationToken
        };
    }
    async verifyEmail(token) {
        const tenentId = await this.cacheRepo.get(`tenant_verificationToken:${token}`);
        if (!tenentId) {
            throw new Error('INVALID_OR_EXPIRED_TOKEN');
        }
        await this.tenantRepo.updateStatus(tenentId, 'active');
        return {
            message: 'Email verified successfully. You can now log in.',
            tenant_id: tenentId
        };
    }
    async login(email, password) {
        const tenant = await this.tenantRepo.findByEmail(email);
        if (!tenant) {
            throw new Error('INVALID_CREDENTIALS');
        }
        if (tenant.status === 'pending') {
            throw new Error('EMAIL_NOT_VERIFIED');
        }
        if (tenant.status !== 'active') {
            throw new Error('ACCOUNT_INACTIVE');
        }
        const isMatch = await bcrypt.compare(password, tenant.password_hash);
        if (!isMatch) {
            throw new Error('INVALID_CREDENTIALS');
        }
        const accessToken = jwt.sign({
            tenant_id: tenant._id,
            email: tenant.contact_email,
            role: 'tenant_owner'
        }, this.jwtSecret, { expiresIn: ACCESS_TOKEN_EXPIRY });
        const tokenId = nanoid(16);
        const refreshToken = jwt.sign({
            tenant_id: tenant._id,
            token_id: tokenId
        }, this.jwtRefreshSecret, { expiresIn: REFRESH_TOKEN_EXPIRY });
        await this.cacheRepo.set(`tenant_refresh_token:${tenant._id}:${tokenId}`, refreshToken, { EX: REFRESH_TOKEN_TTL_SECONDS });
        return {
            accessToken,
            refreshToken,
            tenant: {
                tenant_id: tenant._id,
                business_name: tenant.business_name,
                contact_email: tenant.contact_email,
                tier: tenant.tier,
                status: tenant.status
            }
        };
    }
    async refreshToken(incomingRefreshToken) {
        let payload;
        try {
            payload = jwt.verify(incomingRefreshToken, this.jwtRefreshSecret);
        }
        catch {
            throw new Error('INVALID_OR_EXPIRED_REFRESH_TOKEN');
        }
        if (!payload?.tenant_id || !payload?.token_id) {
            throw new Error('INVALID_OR_EXPIRED_REFRESH_TOKEN');
        }
        const sessionKey = `tenant_refresh_token:${payload.tenant_id}:${payload.token_id}`;
        const storedToken = await this.cacheRepo.get(sessionKey);
        if (!storedToken || storedToken !== incomingRefreshToken) {
            if (storedToken) {
                await this.cacheRepo.delete(sessionKey);
            }
            throw new Error('INVALID_OR_REVOKED_REFRESH_TOKEN');
        }
        await this.cacheRepo.delete(sessionKey);
        const tenant = await this.tenantRepo.findById(payload.tenant_id);
        if (!tenant || tenant.status !== 'active') {
            throw new Error('TENANT_NOT_FOUND_OR_INACTIVE');
        }
        const newAccessToken = jwt.sign({
            tenant_id: tenant._id,
            email: tenant.contact_email,
            role: 'tenant_owner'
        }, this.jwtSecret, { expiresIn: ACCESS_TOKEN_EXPIRY });
        const newTokenId = nanoid(16);
        const newRefreshToken = jwt.sign({
            tenant_id: tenant._id,
            token_id: newTokenId
        }, this.jwtRefreshSecret, { expiresIn: REFRESH_TOKEN_EXPIRY });
        await this.cacheRepo.set(`tenant_refresh_token:${tenant._id}:${newTokenId}`, newRefreshToken, { EX: REFRESH_TOKEN_TTL_SECONDS });
        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            tenant: {
                tenant_id: tenant._id,
                business_name: tenant.business_name,
                contact_email: tenant.contact_email,
                tier: tenant.tier,
                status: tenant.status
            }
        };
    }
    async logout(refreshToken) {
        if (refreshToken) {
            try {
                const payload = jwt.verify(refreshToken, this.jwtRefreshSecret);
                if (payload?.tenant_id && payload?.token_id) {
                    await this.cacheRepo.delete(`tenant_refresh_token:${payload.tenant_id}:${payload.token_id}`);
                }
            }
            catch {
            }
        }
        return { message: 'Logged out successfully' };
    }
};
TenantService = __decorate([
    Injectable(),
    __param(0, Inject(TenantRepository)),
    __param(1, Inject(CacheRepository)),
    __param(2, Inject(ConfigService)),
    __param(3, Inject('EMAIL_PRODUCER')),
    __metadata("design:paramtypes", [TenantRepository,
        CacheRepository,
        ConfigService, Object])
], TenantService);
export { TenantService };
