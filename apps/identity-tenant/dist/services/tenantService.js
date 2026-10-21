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
import crypto from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { nanoid } from 'nanoid';
let TenantService = class TenantService {
    tenantRepo;
    dashboardUserRepo;
    cacheRepo;
    passwordHasher;
    jwtService;
    configService;
    emailProducer;
    jwtSecret;
    jwtRefreshSecret;
    googleClient;
    accessTokenExpiry;
    refreshTokenExpiry;
    refreshTokenTtlSeconds;
    constructor(tenantRepo, dashboardUserRepo, cacheRepo, passwordHasher, jwtService, configService, emailProducer) {
        this.tenantRepo = tenantRepo;
        this.dashboardUserRepo = dashboardUserRepo;
        this.cacheRepo = cacheRepo;
        this.passwordHasher = passwordHasher;
        this.jwtService = jwtService;
        this.configService = configService;
        this.emailProducer = emailProducer;
        this.jwtSecret = this.configService.get('JWT_SECRET') || 'dev-secret-change-in-prod';
        this.jwtRefreshSecret = this.configService.get('JWT_REFRESH_SECRET') || this.jwtSecret;
        this.googleClient = new OAuth2Client(this.configService.get('GOOGLE_CLIENT_ID'));
        this.accessTokenExpiry = (this.configService.get('ACCESS_TOKEN_EXPIRY') ||
            '15m');
        this.refreshTokenExpiry = (this.configService.get('REFRESH_TOKEN_EXPIRY') ||
            '7d');
        this.refreshTokenTtlSeconds =
            parseInt(this.configService.get('REFRESH_TOKEN_TTL_SECONDS') || '', 10) ||
                7 * 24 * 60 * 60;
    }
    async register(data) {
        let tenantId = `tnt_${nanoid(21)}`;
        const passwordHash = await this.passwordHasher.hash(data.password, 12);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const existingUser = await this.tenantRepo.findByEmail(data.email);
        if (existingUser) {
            if (existingUser.status === 'pending') {
                tenantId = existingUser._id;
                await this.tenantRepo.update(existingUser._id, {
                    business_name: data.business_name,
                    password_hash: passwordHash,
                });
            }
            else {
                throw new Error('EMAIL_ALREADY_EXISTS');
            }
        }
        else {
            await this.tenantRepo.create({
                _id: tenantId,
                business_name: data.business_name,
                contact_email: data.email,
                password_hash: passwordHash,
                tier: 'starter',
                status: 'pending',
            });
        }
        await this.cacheRepo.set(`tenant_verificationToken:${verificationToken}`, tenantId, {
            EX: 3600,
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
            tenant_id: tenantId,
            message: 'Registration successful. Please check your email to verify your account.',
            verification_token: verificationToken,
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
            tenant_id: tenentId,
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
        if (!tenant.password_hash) {
            throw new Error('INVALID_CREDENTIALS');
        }
        const isMatch = await this.passwordHasher.compare(password, tenant.password_hash);
        if (!isMatch) {
            throw new Error('INVALID_CREDENTIALS');
        }
        const accessToken = this.jwtService.sign({
            tenant_id: tenant._id,
            email: tenant.contact_email,
            role: 'tenant_owner',
        }, this.jwtSecret, { expiresIn: this.accessTokenExpiry });
        const tokenId = nanoid(16);
        const refreshToken = this.jwtService.sign({
            tenant_id: tenant._id,
            token_id: tokenId,
        }, this.jwtRefreshSecret, { expiresIn: this.refreshTokenExpiry });
        await this.cacheRepo.set(`tenant_refresh_token:${tenant._id}:${tokenId}`, refreshToken, {
            EX: this.refreshTokenTtlSeconds,
        });
        return {
            accessToken,
            refreshToken,
            tenant: {
                tenant_id: tenant._id,
                business_name: tenant.business_name,
                contact_email: tenant.contact_email,
                tier: tenant.tier,
                status: tenant.status,
            },
        };
    }
    async googleLogin(idToken) {
        if (!idToken) {
            throw new Error('GOOGLE_ID_TOKEN_REQUIRED');
        }
        let email;
        let name;
        let googleId;
        try {
            const audience = this.configService.get('GOOGLE_CLIENT_ID');
            const ticket = await this.googleClient.verifyIdToken({
                idToken,
                audience: audience || undefined,
            });
            const payload = ticket.getPayload();
            if (!payload || !payload.email) {
                throw new Error('INVALID_GOOGLE_PAYLOAD');
            }
            email = payload.email.toLowerCase().trim();
            name = payload.name || payload.given_name || email.split('@')[0];
            googleId = payload.sub;
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : 'INVALID_GOOGLE_TOKEN';
            throw new Error(msg);
        }
        let tenant = await this.tenantRepo.findByEmail(email);
        if (tenant) {
            if (tenant.status === 'pending') {
                tenant.status = 'active';
                await tenant.save();
            }
            if (tenant.status !== 'active') {
                throw new Error('ACCOUNT_INACTIVE');
            }
        }
        else {
            const tenantId = `tnt_${nanoid(21)}`;
            tenant = await this.tenantRepo.create({
                _id: tenantId,
                business_name: name || 'My Workspace',
                contact_email: email,
                password_hash: '',
                auth_provider: 'google',
                google_id: googleId,
                tier: 'starter',
                status: 'active',
            });
        }
        const accessToken = this.jwtService.sign({
            tenant_id: tenant._id,
            email: tenant.contact_email,
            role: 'tenant_owner',
        }, this.jwtSecret, { expiresIn: this.accessTokenExpiry });
        const tokenId = nanoid(16);
        const refreshToken = this.jwtService.sign({
            tenant_id: tenant._id,
            token_id: tokenId,
        }, this.jwtRefreshSecret, { expiresIn: this.refreshTokenExpiry });
        await this.cacheRepo.set(`tenant_refresh_token:${tenant._id}:${tokenId}`, refreshToken, {
            EX: this.refreshTokenTtlSeconds,
        });
        return {
            accessToken,
            refreshToken,
            tenant: {
                tenant_id: tenant._id,
                business_name: tenant.business_name,
                contact_email: tenant.contact_email,
                tier: tenant.tier,
                status: tenant.status,
            },
        };
    }
    async getProfile(tenantId) {
        const tenant = await this.tenantRepo.findByTenantId(tenantId);
        if (!tenant) {
            throw new Error('TENANT_NOT_FOUND');
        }
        if (tenant.status !== 'active') {
            throw new Error('ACCOUNT_INACTIVE');
        }
        return {
            tenant: {
                tenant_id: tenant._id,
                business_name: tenant.business_name,
                contact_email: tenant.contact_email,
                tier: tenant.tier,
                status: tenant.status,
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
        const newAccessToken = this.jwtService.sign({
            tenant_id: tenant._id,
            email: tenant.contact_email,
            role: 'tenant_owner',
        }, this.jwtSecret, { expiresIn: this.accessTokenExpiry });
        const newTokenId = nanoid(16);
        const newRefreshToken = this.jwtService.sign({
            tenant_id: tenant._id,
            token_id: newTokenId,
        }, this.jwtRefreshSecret, { expiresIn: this.refreshTokenExpiry });
        await this.cacheRepo.set(`tenant_refresh_token:${tenant._id}:${newTokenId}`, newRefreshToken, {
            EX: this.refreshTokenTtlSeconds,
        });
        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            tenant: {
                tenant_id: tenant._id,
                business_name: tenant.business_name,
                contact_email: tenant.contact_email,
                tier: tenant.tier,
                status: tenant.status,
            },
        };
    }
    async logout(refreshToken) {
        if (refreshToken) {
            try {
                const payload = this.jwtService.verify(refreshToken, this.jwtRefreshSecret);
                if (payload?.tenant_id && payload?.token_id) {
                    await this.cacheRepo.delete(`tenant_refresh_token:${payload.tenant_id}:${payload.token_id}`);
                }
            }
            catch { }
        }
        return { message: 'Logged out successfully' };
    }
    async forgotPassword(email) {
        const tenant = await this.tenantRepo.findByEmail(email.toLowerCase().trim());
        if (!tenant || tenant.status !== 'active') {
            return { message: 'If that email exists, a password reset link has been sent.' };
        }
        const resetToken = crypto.randomBytes(32).toString('hex');
        await this.cacheRepo.set(`tenant_password_reset:${resetToken}`, tenant._id, { EX: 900 });
        if (this.emailProducer) {
            await this.emailProducer.sendForgotPasswordEmail({
                to: tenant.contact_email,
                name: tenant.business_name,
                reset_token: resetToken,
                role: 'tenant',
            });
        }
        return { message: 'If that email exists, a password reset link has been sent.' };
    }
    async resetPassword(token, new_password) {
        const tenantId = await this.cacheRepo.get(`tenant_password_reset:${token}`);
        if (!tenantId) {
            throw new Error('INVALID_OR_EXPIRED_TOKEN');
        }
        const password_hash = await this.passwordHasher.hash(new_password, 12);
        await this.tenantRepo.update(tenantId, { password_hash });
        await this.cacheRepo.delete(`tenant_password_reset:${token}`);
        return { message: 'Password has been successfully reset. You can now log in.' };
    }
    async inviteUser(data) {
        const tenant = await this.tenantRepo.findByTenantId(data.tenant_id);
        if (!tenant) {
            throw new Error('TENANT_NOT_FOUND');
        }
        const existingUser = await this.dashboardUserRepo.findByEmail(data.email.toLowerCase().trim());
        if (existingUser) {
            throw new Error('USER_ALREADY_EXISTS');
        }
        const rawPassword = nanoid(8);
        console.log(rawPassword, 'passwordddddddddddd');
        const password_hash = await this.passwordHasher.hash(rawPassword, 10);
        const user = await this.dashboardUserRepo.create({
            tenant_id: data.tenant_id,
            email: data.email.toLowerCase().trim(),
            password_hash,
            name: data.name.trim(),
            system_role: data.system_role === 'root' ? 'root' : 'manager',
        });
        if (this.emailProducer) {
            await this.emailProducer.sendUserInvitationEmail({
                to: user.email,
                name: user.name,
                tenant_id: data.tenant_id,
                business_name: tenant.business_name,
                password: rawPassword,
                system_role: user.system_role,
            });
        }
        return {
            message: 'Dashboard user invited successfully',
            user_id: user._id.toString(),
            email: user.email,
            name: user.name,
            system_role: user.system_role,
        };
    }
    async listWorkspaceUsers(options) {
        const { users, total_count } = await this.dashboardUserRepo.findWorkspaceUsers({
            tenantId: options.tenant_id,
            page: options.page,
            limit: options.limit,
            search: options.search,
            role: options.role,
        });
        return {
            users: users.map((u) => ({
                user_id: u._id.toString(),
                tenant_id: u.tenant_id,
                email: u.email,
                name: u.name,
                system_role: u.system_role,
                created_at: u.created_at ? u.created_at.toISOString() : new Date().toISOString(),
            })),
            total_count,
        };
    }
};
TenantService = __decorate([
    Injectable(),
    __param(0, Inject('ITenantRepository')),
    __param(1, Inject('IDashboardUserRepository')),
    __param(2, Inject('ICacheRepository')),
    __param(3, Inject('IPasswordHasher')),
    __param(4, Inject('IJwtService')),
    __param(5, Inject(ConfigService)),
    __param(6, Inject('IEmailProducer')),
    __metadata("design:paramtypes", [Object, Object, Object, Object, Object, ConfigService, Object])
], TenantService);
export { TenantService };
