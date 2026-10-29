import crypto from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  InviteUserRequest,
  InviteUserResponse,
  ListWorkspaceUsersRequest,
  ListWorkspaceUsersResponse,
} from '@repo/proto/dashboard';
import type { RegisterRequest, RegisterResponse } from '@repo/proto/tenant';
import { OAuth2Client } from 'google-auth-library';
import type { SignOptions } from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { RESPONSE_MESSAGES } from '../constants/messages.constant.js';
import { ICacheRepository } from '../interfaces/ICacheRepository.js';
import { IDashboardUserRepository } from '../interfaces/IDashboardUserRepository.js';
import { IEmailProducer } from '../interfaces/IEmailProducer.js';
import { IJwtService } from '../interfaces/IJwtService.js';
import { IPasswordHasher } from '../interfaces/IPasswordHasher.js';
import { ITenantRepository } from '../interfaces/ITenantRepository.js';
import { ITenantService } from '../interfaces/ITenantService.js';

@Injectable()
export class TenantService implements ITenantService {
  private readonly _jwtSecret: string;
  private readonly _jwtRefreshSecret: string;
  private readonly _googleClient: OAuth2Client;
  private readonly _accessTokenExpiry: SignOptions['expiresIn'];
  private readonly _refreshTokenExpiry: SignOptions['expiresIn'];
  private readonly _refreshTokenTtlSeconds: number;

  constructor(
    @Inject('ITenantRepository') private readonly _tenantRepo: ITenantRepository,
    @Inject('IDashboardUserRepository') private readonly _dashboardUserRepo: IDashboardUserRepository,
    @Inject('ICacheRepository') private readonly _cacheRepo: ICacheRepository,
    @Inject('IPasswordHasher') private readonly _passwordHasher: IPasswordHasher,
    @Inject('IJwtService') private readonly _jwtService: IJwtService,
    @Inject(ConfigService) private readonly _configService: ConfigService,
    @Inject('IEmailProducer') private readonly _emailProducer?: IEmailProducer,
  ) {
    this._jwtSecret = this._configService.get<string>('JWT_SECRET') || 'dev-secret-change-in-prod';
    this._jwtRefreshSecret = this._configService.get<string>('JWT_REFRESH_SECRET') || this._jwtSecret;
    this._googleClient = new OAuth2Client(this._configService.get<string>('GOOGLE_CLIENT_ID'));
    this._accessTokenExpiry = (this._configService.get<string>('ACCESS_TOKEN_EXPIRY') ||
      '15m') as SignOptions['expiresIn'];
    this._refreshTokenExpiry = (this._configService.get<string>('REFRESH_TOKEN_EXPIRY') ||
      '7d') as SignOptions['expiresIn'];
    this._refreshTokenTtlSeconds =
      parseInt(this._configService.get<string>('REFRESH_TOKEN_TTL_SECONDS') || '', 10) ||
      7 * 24 * 60 * 60;
  }

  async register(data: RegisterRequest): Promise<RegisterResponse> {
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
      } else {
        throw new Error(RESPONSE_MESSAGES.ERRORS.EMAIL_ALREADY_EXISTS);
      }
    } else {
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

  async verifyEmail(token: string) {
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

  async login(email: string, password: string) {
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

    const accessToken = this._jwtService.sign(
      {
        tenant_id: tenant._id,
        email: tenant.contact_email,
        role: 'tenant_owner',
      },
      this._jwtSecret,
      { expiresIn: this._accessTokenExpiry },
    );

    const tokenId = nanoid(16);
    const refreshToken = this._jwtService.sign(
      {
        tenant_id: tenant._id,
        token_id: tokenId,
      },
      this._jwtRefreshSecret,
      { expiresIn: this._refreshTokenExpiry },
    );

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

  async googleLogin(idToken: string) {
    if (!idToken) {
      throw new Error(RESPONSE_MESSAGES.ERRORS.GOOGLE_ID_TOKEN_REQUIRED);
    }

    let email: string;
    let name: string;
    let googleId: string;

    try {
      const audience = this._configService.get<string>('GOOGLE_CLIENT_ID');
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
    } catch (err: unknown) {
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
    } else {
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

    const accessToken = this._jwtService.sign(
      {
        tenant_id: tenant._id,
        email: tenant.contact_email,
        role: 'tenant_owner',
      },
      this._jwtSecret,
      { expiresIn: this._accessTokenExpiry },
    );

    const tokenId = nanoid(16);
    const refreshToken = this._jwtService.sign(
      {
        tenant_id: tenant._id,
        token_id: tokenId,
      },
      this._jwtRefreshSecret,
      { expiresIn: this._refreshTokenExpiry },
    );

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

  async getProfile(tenantId: string) {
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

  async refreshToken(incomingRefreshToken: string) {
    let payload: { tenant_id: string; token_id: string };
    try {
      payload = this._jwtService.verify(incomingRefreshToken, this._jwtRefreshSecret) as {
        tenant_id: string;
        token_id: string;
      };
    } catch {
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

    const newAccessToken = this._jwtService.sign(
      {
        tenant_id: tenant._id,
        email: tenant.contact_email,
        role: 'tenant_owner',
      },
      this._jwtSecret,
      { expiresIn: this._accessTokenExpiry },
    );

    const newTokenId = nanoid(16);
    const newRefreshToken = this._jwtService.sign(
      {
        tenant_id: tenant._id,
        token_id: newTokenId,
      },
      this._jwtRefreshSecret,
      { expiresIn: this._refreshTokenExpiry },
    );

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

  async logout(refreshToken?: string) {
    if (refreshToken) {
      try {
        const payload = this._jwtService.verify(refreshToken, this._jwtRefreshSecret) as {
          tenant_id: string;
          token_id: string;
        };
        if (payload?.tenant_id && payload?.token_id) {
          await this._cacheRepo.delete(
            `tenant_refresh_token:${payload.tenant_id}:${payload.token_id}`,
          );
        }
      } catch {}
    }
    return { message: RESPONSE_MESSAGES.AUTH.LOGGED_OUT_SUCCESS };
  }

  async forgotPassword(email: string) {
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

  async resetPassword(token: string, new_password: string) {
    const tenantId = await this._cacheRepo.get(`tenant_password_reset:${token}`);
    if (!tenantId) {
      throw new Error(RESPONSE_MESSAGES.ERRORS.INVALID_OR_EXPIRED_TOKEN);
    }

    const password_hash = await this._passwordHasher.hash(new_password, 12);
    await this._tenantRepo.update(tenantId, { password_hash });
    await this._cacheRepo.delete(`tenant_password_reset:${token}`);

    return { message: RESPONSE_MESSAGES.AUTH.PASSWORD_RESET_SUCCESS };
  }

  async inviteUser(data: InviteUserRequest): Promise<InviteUserResponse> {
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

  async listWorkspaceUsers(
    options: ListWorkspaceUsersRequest,
  ): Promise<ListWorkspaceUsersResponse> {
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
}

