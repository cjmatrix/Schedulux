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
import { RESPONSE_MESSAGES } from '../constants/messages.constant.js';
let TenantService = class TenantService {
    _tenantRepo;
    _dashboardUserRepo;
    _cacheRepo;
    _passwordHasher;
    _jwtService;
    _configService;
    _emailProducer;
    _jwtSecret;
    _jwtRefreshSecret;
    _googleClient;
    _accessTokenExpiry;
    _refreshTokenExpiry;
    _refreshTokenTtlSeconds;
    constructor(_tenantRepo, _dashboardUserRepo, _cacheRepo, _passwordHasher, _jwtService, _configService, _emailProducer) {
        this._tenantRepo = _tenantRepo;
        this._dashboardUserRepo = _dashboardUserRepo;
        this._cacheRepo = _cacheRepo;
        this._passwordHasher = _passwordHasher;
        this._jwtService = _jwtService;
        this._configService = _configService;
        this._emailProducer = _emailProducer;
        this._jwtSecret = this._configService.get('JWT_SECRET') || 'dev-secret-change-in-prod';
        this._jwtRefreshSecret = this._configService.get('JWT_REFRESH_SECRET') || this._jwtSecret;
        this._googleClient = new OAuth2Client(this._configService.get('GOOGLE_CLIENT_ID'));
        this._accessTokenExpiry = (this._configService.get('ACCESS_TOKEN_EXPIRY') ||
            '15m');
        this._refreshTokenExpiry = (this._configService.get('REFRESH_TOKEN_EXPIRY') ||
            '7d');
        this._refreshTokenTtlSeconds =
            parseInt(this._configService.get('REFRESH_TOKEN_TTL_SECONDS') || '', 10) ||
                7 * 24 * 60 * 60;
    }
    async register(data) {
        let tenantId = `tnt_${nanoid(21)}`;
        const passwordHash = await this._passwordHasher.hash(data.password, 12);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const existingUser = await this._tenantRepo.findByEmail(data.email);
        if (existingUser) {
            if (existingUser.status === 'pending') {
                tenantId = existingUser._id;
                await this._tenantRepo.update(existingUser._id, {
                    business_name: data.business_name,
                    password_hash: passwordHash,
                });
            }
            else {
                throw new Error(RESPONSE_MESSAGES.ERRORS.EMAIL_ALREADY_EXISTS);
            }
        }
        else {
            await this._tenantRepo.create({
                _id: tenantId,
                business_name: data.business_name,
                contact_email: data.email,
                password_hash: passwordHash,
                tier: 'starter',
                status: 'pending',
            });
        }
        await this._cacheRepo.set(`tenant_verificationToken:${verificationToken}`, tenantId, {
            EX: 3600,
        });
        if (this._emailProducer) {
            await this._emailProducer.sendVerificationEmail({
                to: data.email,
                business_name: data.business_name,
                full_name: data.full_name,
                tenant_id: tenantId,
                verification_token: verificationToken,
            });
        }
        return {
            tenant_id: tenantId,
            message: RESPONSE_MESSAGES.AUTH.REGISTRATION_SUCCESS,
            verification_token: verificationToken,
        };
    }
    async verifyEmail(token) {
        const tenentId = await this._cacheRepo.get(`tenant_verificationToken:${token}`);
        if (!tenentId) {
            throw new Error(RESPONSE_MESSAGES.ERRORS.INVALID_OR_EXPIRED_TOKEN);
        }
        await this._tenantRepo.updateStatus(tenentId, 'active');
        return {
            message: RESPONSE_MESSAGES.AUTH.EMAIL_VERIFIED_SUCCESS,
            tenant_id: tenentId,
        };
    }
    async login(email, password) {
        const tenant = await this._tenantRepo.findByEmail(email);
        if (!tenant) {
            throw new Error(RESPONSE_MESSAGES.ERRORS.INVALID_CREDENTIALS);
        }
        if (tenant.status === 'pending') {
            throw new Error(RESPONSE_MESSAGES.ERRORS.EMAIL_NOT_VERIFIED);
        }
        if (tenant.status !== 'active') {
            throw new Error(RESPONSE_MESSAGES.ERRORS.ACCOUNT_INACTIVE);
        }
        if (!tenant.password_hash) {
            throw new Error(RESPONSE_MESSAGES.ERRORS.INVALID_CREDENTIALS);
        }
        const isMatch = await this._passwordHasher.compare(password, tenant.password_hash);
        if (!isMatch) {
            throw new Error(RESPONSE_MESSAGES.ERRORS.INVALID_CREDENTIALS);
        }
        const accessToken = this._jwtService.sign({
            tenant_id: tenant._id,
            email: tenant.contact_email,
            role: 'tenant_owner',
        }, this._jwtSecret, { expiresIn: this._accessTokenExpiry });
        const tokenId = nanoid(16);
        const refreshToken = this._jwtService.sign({
            tenant_id: tenant._id,
            token_id: tokenId,
        }, this._jwtRefreshSecret, { expiresIn: this._refreshTokenExpiry });
        await this._cacheRepo.set(`tenant_refresh_token:${tenant._id}:${tokenId}`, refreshToken, {
            EX: this._refreshTokenTtlSeconds,
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
            throw new Error(RESPONSE_MESSAGES.ERRORS.GOOGLE_ID_TOKEN_REQUIRED);
        }
        let email;
        let name;
        let googleId;
        try {
            const audience = this._configService.get('GOOGLE_CLIENT_ID');
            const ticket = await this._googleClient.verifyIdToken({
                idToken,
                audience: audience || undefined,
            });
            const payload = ticket.getPayload();
            if (!payload || !payload.email) {
                throw new Error(RESPONSE_MESSAGES.ERRORS.INVALID_GOOGLE_PAYLOAD);
            }
            email = payload.email.toLowerCase().trim();
            name = payload.name || payload.given_name || email.split('@')[0];
            googleId = payload.sub;
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : 'INVALID_GOOGLE_TOKEN';
            throw new Error(msg);
        }
        let tenant = await this._tenantRepo.findByEmail(email);
        if (tenant) {
            if (tenant.status === 'pending') {
                tenant.status = 'active';
                await tenant.save();
            }
            if (tenant.status !== 'active') {
                throw new Error(RESPONSE_MESSAGES.ERRORS.ACCOUNT_INACTIVE);
            }
        }
        else {
            const tenantId = `tnt_${nanoid(21)}`;
            tenant = await this._tenantRepo.create({
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
        const accessToken = this._jwtService.sign({
            tenant_id: tenant._id,
            email: tenant.contact_email,
            role: 'tenant_owner',
        }, this._jwtSecret, { expiresIn: this._accessTokenExpiry });
        const tokenId = nanoid(16);
        const refreshToken = this._jwtService.sign({
            tenant_id: tenant._id,
            token_id: tokenId,
        }, this._jwtRefreshSecret, { expiresIn: this._refreshTokenExpiry });
        await this._cacheRepo.set(`tenant_refresh_token:${tenant._id}:${tokenId}`, refreshToken, {
            EX: this._refreshTokenTtlSeconds,
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
        const tenant = await this._tenantRepo.findByTenantId(tenantId);
        if (!tenant) {
            throw new Error(RESPONSE_MESSAGES.ERRORS.TENANT_NOT_FOUND);
        }
        if (tenant.status !== 'active') {
            throw new Error(RESPONSE_MESSAGES.ERRORS.ACCOUNT_INACTIVE);
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
            payload = this._jwtService.verify(incomingRefreshToken, this._jwtRefreshSecret);
        }
        catch {
            throw new Error(RESPONSE_MESSAGES.ERRORS.INVALID_OR_EXPIRED_REFRESH_TOKEN);
        }
        if (!payload?.tenant_id || !payload?.token_id) {
            throw new Error(RESPONSE_MESSAGES.ERRORS.INVALID_OR_EXPIRED_REFRESH_TOKEN);
        }
        const sessionKey = `tenant_refresh_token:${payload.tenant_id}:${payload.token_id}`;
        const storedToken = await this._cacheRepo.get(sessionKey);
        if (!storedToken || storedToken !== incomingRefreshToken) {
            if (storedToken) {
                await this._cacheRepo.delete(sessionKey);
            }
            throw new Error(RESPONSE_MESSAGES.ERRORS.INVALID_OR_REVOKED_REFRESH_TOKEN);
        }
        await this._cacheRepo.delete(sessionKey);
        const tenant = await this._tenantRepo.findById(payload.tenant_id);
        if (!tenant || tenant.status !== 'active') {
            throw new Error(RESPONSE_MESSAGES.ERRORS.TENANT_NOT_FOUND_OR_INACTIVE);
        }
        const newAccessToken = this._jwtService.sign({
            tenant_id: tenant._id,
            email: tenant.contact_email,
            role: 'tenant_owner',
        }, this._jwtSecret, { expiresIn: this._accessTokenExpiry });
        const newTokenId = nanoid(16);
        const newRefreshToken = this._jwtService.sign({
            tenant_id: tenant._id,
            token_id: newTokenId,
        }, this._jwtRefreshSecret, { expiresIn: this._refreshTokenExpiry });
        await this._cacheRepo.set(`tenant_refresh_token:${tenant._id}:${newTokenId}`, newRefreshToken, {
            EX: this._refreshTokenTtlSeconds,
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
                const payload = this._jwtService.verify(refreshToken, this._jwtRefreshSecret);
                if (payload?.tenant_id && payload?.token_id) {
                    await this._cacheRepo.delete(`tenant_refresh_token:${payload.tenant_id}:${payload.token_id}`);
                }
            }
            catch { }
        }
        return { message: RESPONSE_MESSAGES.AUTH.LOGGED_OUT_SUCCESS };
    }
    async forgotPassword(email) {
        const tenant = await this._tenantRepo.findByEmail(email.toLowerCase().trim());
        if (!tenant || tenant.status !== 'active') {
            return { message: RESPONSE_MESSAGES.AUTH.PASSWORD_RESET_SENT };
        }
        const resetToken = crypto.randomBytes(32).toString('hex');
        await this._cacheRepo.set(`tenant_password_reset:${resetToken}`, tenant._id, { EX: 900 });
        if (this._emailProducer) {
            await this._emailProducer.sendForgotPasswordEmail({
                to: tenant.contact_email,
                name: tenant.business_name,
                reset_token: resetToken,
                role: 'tenant',
            });
        }
        return { message: RESPONSE_MESSAGES.AUTH.PASSWORD_RESET_SENT };
    }
    async resetPassword(token, new_password) {
        const tenantId = await this._cacheRepo.get(`tenant_password_reset:${token}`);
        if (!tenantId) {
            throw new Error(RESPONSE_MESSAGES.ERRORS.INVALID_OR_EXPIRED_TOKEN);
        }
        const password_hash = await this._passwordHasher.hash(new_password, 12);
        await this._tenantRepo.update(tenantId, { password_hash });
        await this._cacheRepo.delete(`tenant_password_reset:${token}`);
        return { message: RESPONSE_MESSAGES.AUTH.PASSWORD_RESET_SUCCESS };
    }
    async inviteUser(data) {
        const tenant = await this._tenantRepo.findByTenantId(data.tenant_id);
        if (!tenant) {
            throw new Error(RESPONSE_MESSAGES.ERRORS.TENANT_NOT_FOUND);
        }
        const existingUser = await this._dashboardUserRepo.findByEmail(data.email.toLowerCase().trim());
        if (existingUser) {
            throw new Error(RESPONSE_MESSAGES.ERRORS.USER_ALREADY_EXISTS);
        }
        const rawPassword = nanoid(8);
        const password_hash = await this._passwordHasher.hash(rawPassword, 10);
        const user = await this._dashboardUserRepo.create({
            tenant_id: data.tenant_id,
            email: data.email.toLowerCase().trim(),
            password_hash,
            name: data.name.trim(),
            system_role: data.system_role === 'root' ? 'root' : 'manager',
        });
        if (this._emailProducer) {
            await this._emailProducer.sendUserInvitationEmail({
                to: user.email,
                name: user.name,
                tenant_id: data.tenant_id,
                business_name: tenant.business_name,
                password: rawPassword,
                system_role: user.system_role,
            });
        }
        return {
            message: RESPONSE_MESSAGES.AUTH.USER_INVITED_SUCCESS,
            user_id: user._id.toString(),
            email: user.email,
            name: user.name,
            system_role: user.system_role,
        };
    }
    async listWorkspaceUsers(options) {
        const { users, total_count } = await this._dashboardUserRepo.findWorkspaceUsers({
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
