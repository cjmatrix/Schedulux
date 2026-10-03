import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { nanoid } from 'nanoid';
import { IDashboardUserRepository } from '../interfaces/IDashboardUserRepository.js';
import { ICacheRepository } from '../interfaces/ICacheRepository.js';
import { IPasswordHasher } from '../interfaces/IPasswordHasher.js';
import { IJwtService } from '../interfaces/IJwtService.js';
import { IEmailProducer } from '../interfaces/IEmailProducer.js';
import { DashboardUserLoginRequest, DashboardUserLoginResponse, DashboardUserProfileRequest, DashboardUserProfileResponse, DashboardUserRefreshTokenRequest, DashboardUserRefreshTokenResponse } from '@repo/proto/dashboard';
import crypto from 'crypto';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

@Injectable()
export class DashboardUserService {
  private readonly jwtSecret: string;
  private readonly jwtRefreshSecret: string;

  constructor(
    @Inject('IDashboardUserRepository') private dashboardUserRepo: IDashboardUserRepository,
    @Inject('ICacheRepository') private cacheRepo: ICacheRepository,
    @Inject('IPasswordHasher') private passwordHasher: IPasswordHasher,
    @Inject('IJwtService') private jwtService: IJwtService,
    @Inject(ConfigService) private configService: ConfigService,
    @Inject('IEmailProducer') private emailProducer?: IEmailProducer
  ) {
    this.jwtSecret = this.configService.get<string>('JWT_SECRET') || 'dev-secret-change-in-prod';
    this.jwtRefreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || this.jwtSecret;
  }

  async login(data: DashboardUserLoginRequest): Promise<DashboardUserLoginResponse> {
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

    const accessToken = this.jwtService.sign(
      {
        user_id: user._id.toString(),
        tenant_id: user.tenant_id,
        email: user.email,
        system_role: user.system_role,
        role: user.system_role,
      },
      this.jwtSecret,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const tokenId = nanoid(16);
    const refreshToken = this.jwtService.sign(
      {
        user_id: user._id.toString(),
        tenant_id: user.tenant_id,
        tokenId,
        type: 'dashboard_refresh',
      },
      this.jwtRefreshSecret,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    await this.cacheRepo.set(
      `dashboard_refreshToken:${user._id.toString()}:${tokenId}`,
      refreshToken,
      { EX: REFRESH_TOKEN_TTL_SECONDS }
    );

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

  async getProfile(data: DashboardUserProfileRequest): Promise<DashboardUserProfileResponse> {
    if (!data.user_id) {
      throw new Error('USER_ID_REQUIRED');
    }

    const user = await this.dashboardUserRepo.findById(data.user_id);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
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

  async refreshToken(data: DashboardUserRefreshTokenRequest): Promise<DashboardUserRefreshTokenResponse> {
    if (!data.refresh_token) {
      throw new Error('REFRESH_TOKEN_REQUIRED');
    }

    let decoded: any;
    try {
      decoded = this.jwtService.verify(data.refresh_token, this.jwtRefreshSecret);
    } catch (err) {
      throw new Error('INVALID_REFRESH_TOKEN');
    }

    const userId = decoded.user_id;
    const tokenId = decoded.tokenId;

    if (!userId || !tokenId || decoded.type !== 'dashboard_refresh') {
      throw new Error('INVALID_REFRESH_TOKEN');
    }

    const cachedToken = await this.cacheRepo.get(`dashboard_refreshToken:${userId}:${tokenId}`);
    if (cachedToken !== data.refresh_token) {
     
      await this.cacheRepo.delete(`dashboard_refreshToken:${userId}:${tokenId}`);
      throw new Error('INVALID_REFRESH_TOKEN');
    }

    const user = await this.dashboardUserRepo.findById(userId);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    const newAccessToken = this.jwtService.sign(
      {
        user_id: user._id.toString(),
        tenant_id: user.tenant_id,
        email: user.email,
        system_role: user.system_role,
        role: user.system_role,
      },
      this.jwtSecret,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const newTokenId = nanoid(16);
    const newRefreshToken = this.jwtService.sign(
      {
        user_id: user._id.toString(),
        tenant_id: user.tenant_id,
        tokenId: newTokenId,
        type: 'dashboard_refresh',
      },
      this.jwtRefreshSecret,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    await this.cacheRepo.delete(`dashboard_refreshToken:${userId}:${tokenId}`);
    await this.cacheRepo.set(
      `dashboard_refreshToken:${userId}:${newTokenId}`,
      newRefreshToken,
      { EX: REFRESH_TOKEN_TTL_SECONDS }
    );

    return {
      message: 'Token refreshed successfully',
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.dashboardUserRepo.findByEmail(email.toLowerCase().trim());
    if (!user) {
      return { message: "If that email exists, a password reset link has been sent." };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    await this.cacheRepo.set(`dashboard_password_reset:${resetToken}`, user._id.toString(), { EX: 900 });

    if (this.emailProducer) {
      await this.emailProducer.sendForgotPasswordEmail({
        to: user.email,
        name: user.name,
        reset_token: resetToken,
        role: 'dashboard_user'
      });
    }

    return { message: "If that email exists, a password reset link has been sent." };
  }

  async resetPassword(token: string, new_password: string) {
    const userId = await this.cacheRepo.get(`dashboard_password_reset:${token}`);
    if (!userId) {
      throw new Error("INVALID_OR_EXPIRED_TOKEN");
    }

    const password_hash = await this.passwordHasher.hash(new_password, 10);
    await this.dashboardUserRepo.update(userId, { password_hash });
    await this.cacheRepo.delete(`dashboard_password_reset:${token}`);

    return { message: "Password has been successfully reset. You can now log in." };
  }
}
