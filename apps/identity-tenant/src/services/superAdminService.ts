import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { nanoid } from 'nanoid';
import { ISuperAdminRepository } from '../interfaces/ISuperAdminRepository.js';
import { ICacheRepository } from '../interfaces/ICacheRepository.js';
import { ListTenantsRequest } from "@repo/proto/tenant";
import { ITenantRepository } from '../interfaces/ITenantRepository.js';
import { IPasswordHasher } from '../interfaces/IPasswordHasher.js';
import { IJwtService } from '../interfaces/IJwtService.js';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days in seconds

@Injectable()
export class SuperAdminService {
  private readonly jwtSecret: string;
  private readonly jwtRefreshSecret: string;

  constructor(
    @Inject('ISuperAdminRepository') private superAdminRepo: ISuperAdminRepository,
    @Inject('ICacheRepository') private cacheRepo: ICacheRepository,
    @Inject('ITenantRepository') private tenantRepo: ITenantRepository,
    @Inject('IPasswordHasher') private passwordHasher: IPasswordHasher,
    @Inject('IJwtService') private jwtService: IJwtService,
    @Inject(ConfigService) private configService: ConfigService
  ) {
    const globalSecret = this.configService.get<string>('JWT_SECRET');
    const globalRefreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');

    this.jwtSecret = this.configService.get<string>('SUPERADMIN_JWT_SECRET') || 
      (globalSecret ? `${globalSecret}_superadmin` : 'superadmin_access_secret_2025');

    this.jwtRefreshSecret = this.configService.get<string>('SUPERADMIN_JWT_REFRESH_SECRET') ||
      (globalRefreshSecret ? `${globalRefreshSecret}_superadmin` : 'superadmin_refresh_secret_2025');
  }

  async login(email: string, password: string) {
    const admin = await this.superAdminRepo.findByEmail(email.toLowerCase().trim());
    if (!admin) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const isMatch = await this.passwordHasher.compare(password, admin.password_hash);
    if (!isMatch) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const adminId = admin._id.toString();
    const tokenId = nanoid(16);

  
    const accessToken = this.jwtService.sign(
      {
        super_admin_id: adminId,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
      this.jwtSecret,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

  
    const refreshToken = this.jwtService.sign(
      {
        super_admin_id: adminId,
        token_id: tokenId,
        role: admin.role,
      },
      this.jwtRefreshSecret,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

 
    await this.cacheRepo.set(
      `superadmin_refresh_token:${adminId}:${tokenId}`,
      refreshToken,
      { EX: REFRESH_TOKEN_TTL_SECONDS }
    );

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
      payload = this.jwtService.verify(incomingRefreshToken, this.jwtRefreshSecret) as {
        super_admin_id: string;
        token_id: string;
        role?: string;
      };
    } catch {
      throw new Error('INVALID_OR_EXPIRED_REFRESH_TOKEN');
    }

    if (!payload?.super_admin_id || !payload?.token_id) {
      throw new Error('INVALID_OR_EXPIRED_REFRESH_TOKEN');
    }

    const sessionKey = `superadmin_refresh_token:${payload.super_admin_id}:${payload.token_id}`;
    const storedToken = await this.cacheRepo.get(sessionKey);

    if (!storedToken || storedToken !== incomingRefreshToken) {
      if (storedToken) {
     
        await this.cacheRepo.delete(sessionKey);
      }
      throw new Error('INVALID_OR_REVOKED_REFRESH_TOKEN');
    }

    await this.cacheRepo.delete(sessionKey);

    const admin = await this.superAdminRepo.findById(payload.super_admin_id);
    if (!admin) {
      throw new Error('SUPERADMIN_NOT_FOUND');
    }

    const adminId = admin._id.toString();
    const nextTokenId = nanoid(16);

    const newAccessToken = this.jwtService.sign(
      {
        super_admin_id: adminId,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
      this.jwtSecret,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const newRefreshToken = this.jwtService.sign(
      {
        super_admin_id: adminId,
        token_id: nextTokenId,
        role: admin.role,
      },
      this.jwtRefreshSecret,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    await this.cacheRepo.set(
      `superadmin_refresh_token:${adminId}:${nextTokenId}`,
      newRefreshToken,
      { EX: REFRESH_TOKEN_TTL_SECONDS }
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
      const payload = this.jwtService.verify(incomingRefreshToken, this.jwtRefreshSecret) as {
        super_admin_id: string;
        token_id: string;
      };

      if (payload?.super_admin_id && payload?.token_id) {
        await this.cacheRepo.delete(
          `superadmin_refresh_token:${payload.super_admin_id}:${payload.token_id}`
        );
      }
    } catch {
  
    }
  }

  async createSuperAdmin(data: { email: string; password: string; name: string }) {
    const existing = await this.superAdminRepo.findByEmail(data.email.toLowerCase().trim());
    if (existing) {
      throw new Error('SUPERADMIN_ALREADY_EXISTS');
    }

    const password_hash = await this.passwordHasher.hash(data.password, 10);
    const admin = await this.superAdminRepo.create({
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
    const admin = await this.superAdminRepo.findById(adminId);
    if (!admin) {
      throw new Error('SUPERADMIN_NOT_FOUND');
    }
    return {
      id: admin._id.toString(),
      email: admin.email,
      name: admin.name,
      role: admin.role,
      created_at: admin.created_at,
    };
  }


  async ListTenants(data:ListTenantsRequest){
    return this.tenantRepo.listTenants(data);
  }

  async suspendTenant(tenantId: string) {
    const tenant = await this.tenantRepo.findByTenantId(tenantId);
    if (!tenant) {
      throw new Error('TENANT_NOT_FOUND');
    }

    const nextStatus = tenant.status === 'suspended' ? 'active' : 'suspended';
    const updated = await this.tenantRepo.updateStatus(tenantId, nextStatus);
    if (!updated) {
      throw new Error('FAILED_TO_UPDATE_TENANT_STATUS');
    }

    return {
      message: `Tenant ${nextStatus === 'active' ? 'reactivated' : 'suspended'} successfully`,
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
