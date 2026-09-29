import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { ITenantRepository } from '../interfaces/ITenantRepository.js';
import { ICacheRepository } from '../interfaces/ICacheRepository.js';
import { IEmailProducer } from '../interfaces/IEmailProducer.js';


const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

@Injectable()
export class TenantService {
  private readonly jwtSecret: string;
  private readonly jwtRefreshSecret: string;

  constructor(
    @Inject('ITenantRepository') private tenantRepo: ITenantRepository,
    @Inject('ICacheRepository') private cacheRepo: ICacheRepository,
    @Inject(ConfigService) private configService: ConfigService,
    @Inject('IEmailProducer') private emailProducer?: IEmailProducer
  ) {
    this.jwtSecret = this.configService.get<string>('JWT_SECRET') || 'dev-secret-change-in-prod';
    this.jwtRefreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || this.jwtSecret;
  }

  async register(data: {
    business_name: string
    full_name: string
    email: string
    password: string
  }) {
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

  async verifyEmail(token: string) {
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

  async login(email: string, password: string) {
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

    const accessToken = jwt.sign(
      {
        tenant_id: tenant._id,
        email: tenant.contact_email,
        role: 'tenant_owner'
      },
      this.jwtSecret,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const tokenId = nanoid(16);
    const refreshToken = jwt.sign(
      {
        tenant_id: tenant._id,
        token_id: tokenId
      },
      this.jwtRefreshSecret,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    await this.cacheRepo.set(
      `tenant_refresh_token:${tenant._id}:${tokenId}`,
      refreshToken,
      { EX: REFRESH_TOKEN_TTL_SECONDS }
    );

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

  async refreshToken(incomingRefreshToken: string) {
    let payload: { tenant_id: string; token_id: string };
    try {
      payload = jwt.verify(incomingRefreshToken, this.jwtRefreshSecret) as {
        tenant_id: string
        token_id: string
      };
    } catch {
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

    const newAccessToken = jwt.sign(
      {
        tenant_id: tenant._id,
        email: tenant.contact_email,
        role: 'tenant_owner'
      },
      this.jwtSecret,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const newTokenId = nanoid(16);
    const newRefreshToken = jwt.sign(
      {
        tenant_id: tenant._id,
        token_id: newTokenId
      },
      this.jwtRefreshSecret,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );
 
    await this.cacheRepo.set(
      `tenant_refresh_token:${tenant._id}:${newTokenId}`,
      newRefreshToken,
      { EX: REFRESH_TOKEN_TTL_SECONDS }
    );

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

  async logout(refreshToken?: string) {
    if (refreshToken) {
      try {
        const payload = jwt.verify(refreshToken, this.jwtRefreshSecret) as {
          tenant_id: string
          token_id: string
        };
        if (payload?.tenant_id && payload?.token_id) {
          await this.cacheRepo.delete(`tenant_refresh_token:${payload.tenant_id}:${payload.token_id}`);
        }
      } catch {
       
      }
    }
    return { message: 'Logged out successfully' };
  }
}
