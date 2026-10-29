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
import { nanoid } from 'nanoid';
import { RESPONSE_MESSAGES } from '../constants/messages.constant.js';
let DashboardUserService = class DashboardUserService {
    _dashboardUserRepo;
    _cacheRepo;
    _passwordHasher;
    _jwtService;
    _configService;
    _emailProducer;
    _jwtSecret;
    _jwtRefreshSecret;
    _accessTokenExpiry;
    _refreshTokenExpiry;
    _refreshTokenTtlSeconds;
    constructor(_dashboardUserRepo, _cacheRepo, _passwordHasher, _jwtService, _configService, _emailProducer) {
        this._dashboardUserRepo = _dashboardUserRepo;
        this._cacheRepo = _cacheRepo;
        this._passwordHasher = _passwordHasher;
        this._jwtService = _jwtService;
        this._configService = _configService;
        this._emailProducer = _emailProducer;
        this._jwtSecret = this._configService.get('JWT_SECRET') || 'dev-secret-change-in-prod';
        this._jwtRefreshSecret = this._configService.get('JWT_REFRESH_SECRET') || this._jwtSecret;
        this._accessTokenExpiry = (this._configService.get('ACCESS_TOKEN_EXPIRY') ||
            '15m');
        this._refreshTokenExpiry = (this._configService.get('REFRESH_TOKEN_EXPIRY') ||
            '7d');
        this._refreshTokenTtlSeconds =
            parseInt(this._configService.get('REFRESH_TOKEN_TTL_SECONDS') || '', 10) ||
                7 * 24 * 60 * 60;
    }
    async login(data) {
        if (!data.email || !data.password) {
            throw new Error(RESPONSE_MESSAGES.ERRORS.INVALID_CREDENTIALS);
        }
        const user = await this._dashboardUserRepo.findByEmail(data.email.trim().toLowerCase());
        if (!user) {
            throw new Error(RESPONSE_MESSAGES.ERRORS.INVALID_CREDENTIALS);
        }
        const isMatch = await this._passwordHasher.compare(data.password, user.password_hash);
        if (!isMatch) {
            throw new Error(RESPONSE_MESSAGES.ERRORS.INVALID_CREDENTIALS);
        }
        const accessToken = this._jwtService.sign({
            user_id: user._id.toString(),
            tenant_id: user.tenant_id,
            email: user.email,
            system_role: user.system_role,
            role: user.system_role,
        }, this._jwtSecret, { expiresIn: this._accessTokenExpiry });
        const tokenId = nanoid(16);
        const refreshToken = this._jwtService.sign({
            user_id: user._id.toString(),
            tenant_id: user.tenant_id,
            tokenId,
            type: 'dashboard_refresh',
        }, this._jwtRefreshSecret, { expiresIn: this._refreshTokenExpiry });
        await this._cacheRepo.set(`dashboard_refreshToken:${user._id.toString()}:${tokenId}`, refreshToken, { EX: this._refreshTokenTtlSeconds });
        return {
            message: RESPONSE_MESSAGES.AUTH.DASHBOARD_LOGIN_SUCCESS,
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
    async getProfile(data) {
        if (!data.user_id) {
            throw new Error(RESPONSE_MESSAGES.ERRORS.USER_ID_REQUIRED);
        }
        const user = await this._dashboardUserRepo.findById(data.user_id);
        if (!user) {
            throw new Error(RESPONSE_MESSAGES.ERRORS.USER_NOT_FOUND);
        }
        return {
            user: {
                user_id: user._id.toString(),
                tenant_id: user.tenant_id,
                email: user.email,
                name: user.name,
                system_role: user.system_role,
                created_at: user.created_at ? user.created_at.toISOString() : new Date().toISOString(),
            },
        };
    }
    async refreshToken(data) {
        if (!data.refresh_token) {
            throw new Error(RESPONSE_MESSAGES.ERRORS.REFRESH_TOKEN_REQUIRED);
        }
        let decoded;
        try {
            decoded = this._jwtService.verify(data.refresh_token, this._jwtRefreshSecret);
        }
        catch {
            throw new Error(RESPONSE_MESSAGES.ERRORS.INVALID_REFRESH_TOKEN);
        }
        const userId = decoded.user_id;
        const tokenId = decoded.tokenId;
        if (!userId || !tokenId || decoded.type !== 'dashboard_refresh') {
            throw new Error(RESPONSE_MESSAGES.ERRORS.INVALID_REFRESH_TOKEN);
        }
        const cachedToken = await this._cacheRepo.get(`dashboard_refreshToken:${userId}:${tokenId}`);
        if (cachedToken !== data.refresh_token) {
            await this._cacheRepo.delete(`dashboard_refreshToken:${userId}:${tokenId}`);
            throw new Error(RESPONSE_MESSAGES.ERRORS.INVALID_REFRESH_TOKEN);
        }
        const user = await this._dashboardUserRepo.findById(userId);
        if (!user) {
            throw new Error(RESPONSE_MESSAGES.ERRORS.USER_NOT_FOUND);
        }
        const newAccessToken = this._jwtService.sign({
            user_id: user._id.toString(),
            tenant_id: user.tenant_id,
            email: user.email,
            system_role: user.system_role,
            role: user.system_role,
        }, this._jwtSecret, { expiresIn: this._accessTokenExpiry });
        const newTokenId = nanoid(16);
        const newRefreshToken = this._jwtService.sign({
            user_id: user._id.toString(),
            tenant_id: user.tenant_id,
            tokenId: newTokenId,
            type: 'dashboard_refresh',
        }, this._jwtRefreshSecret, { expiresIn: this._refreshTokenExpiry });
        await this._cacheRepo.delete(`dashboard_refreshToken:${userId}:${tokenId}`);
        await this._cacheRepo.set(`dashboard_refreshToken:${userId}:${newTokenId}`, newRefreshToken, {
            EX: this._refreshTokenTtlSeconds,
        });
        return {
            message: RESPONSE_MESSAGES.AUTH.TOKEN_REFRESHED_SUCCESS,
            access_token: newAccessToken,
            refresh_token: newRefreshToken,
        };
    }
    async forgotPassword(email) {
        const user = await this._dashboardUserRepo.findByEmail(email.toLowerCase().trim());
        if (!user) {
            return { message: RESPONSE_MESSAGES.AUTH.PASSWORD_RESET_SENT };
        }
        const resetToken = crypto.randomBytes(32).toString('hex');
        await this._cacheRepo.set(`dashboard_password_reset:${resetToken}`, user._id.toString(), {
            EX: 900,
        });
        if (this._emailProducer) {
            await this._emailProducer.sendForgotPasswordEmail({
                to: user.email,
                name: user.name,
                reset_token: resetToken,
                role: 'dashboard_user',
            });
        }
        return { message: RESPONSE_MESSAGES.AUTH.PASSWORD_RESET_SENT };
    }
    async resetPassword(token, new_password) {
        const userId = await this._cacheRepo.get(`dashboard_password_reset:${token}`);
        if (!userId) {
            throw new Error(RESPONSE_MESSAGES.ERRORS.INVALID_OR_EXPIRED_TOKEN);
        }
        const password_hash = await this._passwordHasher.hash(new_password, 10);
        await this._dashboardUserRepo.update(userId, { password_hash });
        await this._cacheRepo.delete(`dashboard_password_reset:${token}`);
        return { message: RESPONSE_MESSAGES.AUTH.PASSWORD_RESET_SUCCESS };
    }
};
DashboardUserService = __decorate([
    Injectable(),
    __param(0, Inject('IDashboardUserRepository')),
    __param(1, Inject('ICacheRepository')),
    __param(2, Inject('IPasswordHasher')),
    __param(3, Inject('IJwtService')),
    __param(4, Inject(ConfigService)),
    __param(5, Inject('IEmailProducer')),
    __metadata("design:paramtypes", [Object, Object, Object, Object, ConfigService, Object])
], DashboardUserService);
export { DashboardUserService };
