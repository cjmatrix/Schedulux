import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ListTenantsRequest } from '@repo/proto/tenant';
import type { SignOptions } from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { RESPONSE_MESSAGES } from '../constants/messages.constant.js';
import { ICacheRepository } from '../interfaces/ICacheRepository.js';
import { IJwtService } from '../interfaces/IJwtService.js';
import { IPasswordHasher } from '../interfaces/IPasswordHasher.js';
import { ISuperAdminRepository } from '../interfaces/ISuperAdminRepository.js';
import { ISuperAdminService } from '../interfaces/ISuperAdminService.js';
import { ITenantRepository } from '../interfaces/ITenantRepository.js';

@Injectable()
export class SuperAdminService implements ISuperAdminService {
  private readonly _jwtSecret: string;
  private readonly _jwtRefreshSecret: string;
  private readonly _accessTokenExpiry: SignOptions['expiresIn'];
  private readonly _refreshTokenExpiry: SignOptions['expiresIn'];
  private readonly _refreshTokenTtlSeconds: number;

  constructor(
    @Inject('ISuperAdminRepository') private readonly _superAdminRepo: ISuperAdminRepository,
    @Inject('ICacheRepository') private readonly _cacheRepo: ICacheRepository,
    @Inject('ITenantRepository') private readonly _tenantRepo: ITenantRepository,
    @Inject('IPasswordHasher') private readonly _passwordHasher: IPasswordHasher,
    @Inject('IJwtService') private readonly _jwtService: IJwtService,
    @Inject(ConfigService) private readonly _configService: ConfigService,
  ) {
    const globalSecret = this._configService.get<string>('JWT_SECRET');
    const globalRefreshSecret = this._configService.get<string>('JWT_REFRESH_SECRET');

    this._jwtSecret =
      this._configService.get<string>('SUPERADMIN_JWT_SECRET') ||
      (globalSecret ? `${globalSecret}_superadmin` : 'superadmin_access_secret_2025');

    this._jwtRefreshSecret =
      this._configService.get<string>('SUPERADMIN_JWT_REFRESH_SECRET') ||
      (globalRefreshSecret
        ? `${globalRefreshSecret}_superadmin`
        : 'superadmin_refresh_secret_2025');

    this._accessTokenExpiry = (this._configService.get<string>('ACCESS_TOKEN_EXPIRY') ||
      '15m') as SignOptions['expiresIn'];
    this._refreshTokenExpiry = (this._configService.get<string>('REFRESH_TOKEN_EXPIRY') ||
      '7d') as SignOptions['expiresIn'];
    this._refreshTokenTtlSeconds =
      parseInt(this._configService.get<string>('REFRESH_TOKEN_TTL_SECONDS') || '', 10) ||
      7 * 24 * 60 * 60;
  }

  async login(email: string, password: string) {
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

    const accessToken = this._jwtService.sign(
      {
        super_admin_id: adminId,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
      this._jwtSecret,
      { expiresIn: this._accessTokenExpiry },
    );

    const refreshToken = this._jwtService.sign(
      {
        super_admin_id: adminId,
        token_id: tokenId,
        role: admin.role,
      },
      this._jwtRefreshSecret,
      { expiresIn: this._refreshTokenExpiry },
    );

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

  async refreshToken(incomingRefreshToken: string) {
    let payload: { super_admin_id: string; token_id: string; role?: string };
    try {
      payload = this._jwtService.verify(incomingRefreshToken, this._jwtRefreshSecret) as {
        super_admin_id: string;
        token_id: string;
        role?: string;
      };
    } catch {
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

    const newAccessToken = this._jwtService.sign(
      {
        super_admin_id: adminId,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
      this._jwtSecret,
      { expiresIn: this._accessTokenExpiry },
    );

    const newRefreshToken = this._jwtService.sign(
      {
        super_admin_id: adminId,
        token_id: nextTokenId,
        role: admin.role,
      },
      this._jwtRefreshSecret,
      { expiresIn: this._refreshTokenExpiry },
    );

    await this._cacheRepo.set(
      `superadmin_refresh_token:${adminId}:${nextTokenId}`,
      newRefreshToken,
      { EX: this._refreshTokenTtlSeconds },
    );

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

  async logout(incomingRefreshToken?: string) {
    if (!incomingRefreshToken) return;

    try {
      const payload = this._jwtService.verify(incomingRefreshToken, this._jwtRefreshSecret) as {
        super_admin_id: string;
        token_id: string;
      };

      if (payload?.super_admin_id && payload?.token_id) {
        await this._cacheRepo.delete(
          `superadmin_refresh_token:${payload.super_admin_id}:${payload.token_id}`,
        );
      }
    } catch {}
  }

  async createSuperAdmin(data: { email: string; password: string; name: string }) {
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

  async getProfile(adminId: string) {
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

  async ListTenants(data: ListTenantsRequest) {
    return this._tenantRepo.listTenants(data);
  }

  async suspendTenant(tenantId: string) {
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
}

