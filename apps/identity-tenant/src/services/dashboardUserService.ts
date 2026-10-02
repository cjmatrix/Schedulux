import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { nanoid } from 'nanoid';
import { IDashboardUserRepository } from '../interfaces/IDashboardUserRepository.js';
import { ICacheRepository } from '../interfaces/ICacheRepository.js';
import { IPasswordHasher } from '../interfaces/IPasswordHasher.js';
import { IJwtService } from '../interfaces/IJwtService.js';
import { DashboardUserLoginRequest, DashboardUserLoginResponse } from '@repo/proto/dashboard';

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
    @Inject(ConfigService) private configService: ConfigService
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
        role: 'dashboard_user',
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
}
