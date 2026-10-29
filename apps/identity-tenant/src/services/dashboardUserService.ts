import crypto from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DashboardUserLoginRequest,
  DashboardUserLoginResponse,
  DashboardUserProfileRequest,
  DashboardUserProfileResponse,
  DashboardUserRefreshTokenRequest,
  DashboardUserRefreshTokenResponse,
} from '@repo/proto/dashboard';
import type { SignOptions } from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { RESPONSE_MESSAGES } from '../constants/messages.constant.js';
import { ICacheRepository } from '../interfaces/ICacheRepository.js';
import { IDashboardUserRepository } from '../interfaces/IDashboardUserRepository.js';
import { IDashboardUserService } from '../interfaces/IDashboardUserService.js';
import { IEmailProducer } from '../interfaces/IEmailProducer.js';
import { IJwtService } from '../interfaces/IJwtService.js';
import { IPasswordHasher } from '../interfaces/IPasswordHasher.js';

interface DashboardUserRefreshTokenPayload {
  user_id?: string;
  tokenId?: string;
  type?: string;
}

@Injectable()
export class DashboardUserService implements IDashboardUserService {
  private readonly _jwtSecret: string;
  private readonly _jwtRefreshSecret: string;
  private readonly _accessTokenExpiry: SignOptions['expiresIn'];
  private readonly _refreshTokenExpiry: SignOptions['expiresIn'];
  private readonly _refreshTokenTtlSeconds: number;

  constructor(
    @Inject('IDashboardUserRepository') private readonly _dashboardUserRepo: IDashboardUserRepository,
    @Inject('ICacheRepository') private readonly _cacheRepo: ICacheRepository,
    @Inject('IPasswordHasher') private readonly _passwordHasher: IPasswordHasher,
    @Inject('IJwtService') private readonly _jwtService: IJwtService,
    @Inject(ConfigService) private readonly _configService: ConfigService,
    @Inject('IEmailProducer') private readonly _emailProducer?: IEmailProducer,
  ) {
    this._jwtSecret = this._configService.get<string>('JWT_SECRET') || 'dev-secret-change-in-prod';
    this._jwtRefreshSecret = this._configService.get<string>('JWT_REFRESH_SECRET') || this._jwtSecret;
    this._accessTokenExpiry = (this._configService.get<string>('ACCESS_TOKEN_EXPIRY') ||
      '15m') as SignOptions['expiresIn'];
    this._refreshTokenExpiry = (this._configService.get<string>('REFRESH_TOKEN_EXPIRY') ||
      '7d') as SignOptions['expiresIn'];
    this._refreshTokenTtlSeconds =
      parseInt(this._configService.get<string>('REFRESH_TOKEN_TTL_SECONDS') || '', 10) ||
      7 * 24 * 60 * 60;
  }

  async login(data: DashboardUserLoginRequest): Promise<DashboardUserLoginResponse> {
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

    const accessToken = this._jwtService.sign(
      {
        user_id: user._id.toString(),
        tenant_id: user.tenant_id,
        email: user.email,
        system_role: user.system_role,
        role: user.system_role,
      },
      this._jwtSecret,
      { expiresIn: this._accessTokenExpiry },
    );

    const tokenId = nanoid(16);
    const refreshToken = this._jwtService.sign(
      {
        user_id: user._id.toString(),
        tenant_id: user.tenant_id,
        tokenId,
        type: 'dashboard_refresh',
      },
      this._jwtRefreshSecret,
      { expiresIn: this._refreshTokenExpiry },
    );

    await this._cacheRepo.set(
      `dashboard_refreshToken:${user._id.toString()}:${tokenId}`,
      refreshToken,
      { EX: this._refreshTokenTtlSeconds },
    );

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

  async getProfile(data: DashboardUserProfileRequest): Promise<DashboardUserProfileResponse> {
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

  async refreshToken(
    data: DashboardUserRefreshTokenRequest,
  ): Promise<DashboardUserRefreshTokenResponse> {
    if (!data.refresh_token) {
      throw new Error(RESPONSE_MESSAGES.ERRORS.REFRESH_TOKEN_REQUIRED);
    }

    let decoded: DashboardUserRefreshTokenPayload;
    try {
      decoded = this._jwtService.verify<DashboardUserRefreshTokenPayload>(
        data.refresh_token,
        this._jwtRefreshSecret,
      );
    } catch {
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

    const newAccessToken = this._jwtService.sign(
      {
        user_id: user._id.toString(),
        tenant_id: user.tenant_id,
        email: user.email,
        system_role: user.system_role,
        role: user.system_role,
      },
      this._jwtSecret,
      { expiresIn: this._accessTokenExpiry },
    );

    const newTokenId = nanoid(16);
    const newRefreshToken = this._jwtService.sign(
      {
        user_id: user._id.toString(),
        tenant_id: user.tenant_id,
        tokenId: newTokenId,
        type: 'dashboard_refresh',
      },
      this._jwtRefreshSecret,
      { expiresIn: this._refreshTokenExpiry },
    );

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

  async forgotPassword(email: string) {
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

  async resetPassword(token: string, new_password: string) {
    const userId = await this._cacheRepo.get(`dashboard_password_reset:${token}`);
    if (!userId) {
      throw new Error(RESPONSE_MESSAGES.ERRORS.INVALID_OR_EXPIRED_TOKEN);
    }

    const password_hash = await this._passwordHasher.hash(new_password, 10);
    await this._dashboardUserRepo.update(userId, { password_hash });
    await this._cacheRepo.delete(`dashboard_password_reset:${token}`);

    return { message: RESPONSE_MESSAGES.AUTH.PASSWORD_RESET_SUCCESS };
  }
}

