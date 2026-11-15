import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetTenantByIdResponse, ListTenantsRequest } from '@repo/proto/tenant';
import type { TierConfigItem } from '@repo/proto/superadmin';
import type { SignOptions } from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { RESPONSE_MESSAGES } from '../constants/messages.constant.js';
import { DEFAULT_TIER, STATIC_TIER_CONFIGS, TierConfig } from '../constants/tiers.constant.js';
import { ICacheRepository } from '../interfaces/ICacheRepository.js';
import { IJwtService } from '../interfaces/IJwtService.js';
import { IPasswordHasher } from '../interfaces/IPasswordHasher.js';
import { ISuperAdminRepository } from '../interfaces/ISuperAdminRepository.js';
import {
  ISuperAdminService,
  RevenueDataPointResult,
  SuperAdminOverviewResult,
} from '../interfaces/ISuperAdminService.js';
import { ITenantRepository } from '../interfaces/ITenantRepository.js';
import { ITierConfigRepository } from '../interfaces/ITierConfigRepository.js';
import type { ITokenAnalyticsService } from '../interfaces/ITokenAnalyticsService.js';
import { BillingLedgerModel } from '../model/BillingLedger.js';
import { ITierConfigDoc } from '../model/TierConfig.js';
import { Tenent } from '../model/Tenent.js';

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
    @Inject('ITierConfigRepository') private readonly _tierConfigRepo: ITierConfigRepository,
    @Inject('IPasswordHasher') private readonly _passwordHasher: IPasswordHasher,
    @Inject('IJwtService') private readonly _jwtService: IJwtService,
    @Inject(ConfigService) private readonly _configService: ConfigService,
    @Inject('ITokenAnalyticsService')
    private readonly _tokenAnalyticsService: ITokenAnalyticsService,
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

  private _getCurrentIsoWeek(): string {
    const now = new Date();
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  }

  async ListTenants(data: ListTenantsRequest) {
    const lists = await this._tenantRepo.listTenants(data);
    if (!lists.tenants || lists.tenants.length === 0) {
      return lists;
    }

    try {
      const tierConfigs = await this.listTierConfigs();
      const tierMap = new Map<string, TierConfigItem>(
        tierConfigs.map((cfg) => [cfg.tier.toLowerCase(), cfg]),
      );
      const isoWeek = this._getCurrentIsoWeek();
      const keys = lists.tenants.map(
        (t) => `tenant:${t.tenant_id}:tokens:${isoWeek}`,
      );

      const usages = await this._cacheRepo.mget(...keys);

      const enrichedTenants = lists.tenants.map((t, idx) => {
        const tier = (t.tier || DEFAULT_TIER).toLowerCase();
        const tierCfg = tierMap.get(tier) || STATIC_TIER_CONFIGS[DEFAULT_TIER];
        const limit = Number(tierCfg.weekly_token_limit) ?? 100_000;
        const usage = Number(usages[idx]) || 0;
        const remaining = limit === -1 ? -1 : Math.max(0, limit - usage);

        return {
          ...t,
          weekly_token_limit: limit,
          weekly_token_usage: usage,
          weekly_token_remaining: remaining,
        };
      });

      return {
        tenants: enrichedTenants,
        total_count: lists.total_count,
        stats: lists.stats,
      };
    } catch {
      const fallbackTenants = lists.tenants.map((t) => {
        const tier = (t.tier || DEFAULT_TIER).toLowerCase();
        const limit =
          Number(STATIC_TIER_CONFIGS[tier]?.weekly_token_limit) ?? 100_000;
        return {
          ...t,
          weekly_token_limit: limit,
          weekly_token_usage: 0,
          weekly_token_remaining: limit,
        };
      });

      return {
        tenants: fallbackTenants,
        total_count: lists.total_count,
        stats: lists.stats,
      };
    }
  }

  async getTenantById(tenantId: string): Promise<GetTenantByIdResponse> {
    const tenant = await this._tenantRepo.findByTenantId(tenantId);
    if (!tenant) {
      throw new Error(RESPONSE_MESSAGES.ERRORS.TENANT_NOT_FOUND);
    }
    return {
      tenant: {
        tenant_id: tenant._id.toString(),
        business_name: tenant.business_name,
        contact_email: tenant.contact_email,
        tier: tenant.tier,
        status: tenant.status,
        paddle_customer_id: tenant.paddle_customer_id,
        paddle_subscription_id: tenant.paddle_subscription_id,
        subscription_status: tenant.subscription_status,
      },
    };
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

    await this._cacheRepo.set(`tenant:${tenantId}:status`, nextStatus, { EX: 86400 * 30 });

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

  async getOverview(startDate?: string, endDate?: string): Promise<SuperAdminOverviewResult> {
    const from = startDate ? new Date(startDate) : new Date(0);
    const to = endDate ? new Date(endDate) : new Date();

    const [
      totalTenants,
      activeTenants,
      suspendedTenants,
      tierGroups,
      revenueAggregate,
      totalTokens,
    ] = await Promise.all([
      Tenent.countDocuments({}),
      Tenent.countDocuments({ status: 'active' }),
      Tenent.countDocuments({ status: 'suspended' }),
      Tenent.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$tier', count: { $sum: 1 } } },
      ]),
      BillingLedgerModel.aggregate<{ _id: null; total: number }>([
        {
          $match: {
            created_at: { $gte: from, $lte: to },
            status: { $in: ['completed', 'activated', 'paid'] },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]),
      this._tokenAnalyticsService.getTotalTokens(startDate, endDate).catch(() => 0),
    ]);

    const tenantsByTier: Record<string, number> = {};
    for (const group of tierGroups) {
      if (group._id) {
        tenantsByTier[group._id] = group.count;
      }
    }

    const totalRevenue = revenueAggregate.length > 0 ? revenueAggregate[0].total : 0;

    return {
      totalTenants,
      activeTenants,
      suspendedTenants,
      totalRevenue,
      currency: 'USD',
      tenantsByTier,
      totalTokens,
    };
  }

  async getRevenueChart(
    startDate?: string,
    endDate?: string,
    interval = 'day',
  ): Promise<RevenueDataPointResult[]> {
    const from = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = endDate ? new Date(endDate) : new Date();

    const format = interval === 'month' ? '%Y-%m' : '%Y-%m-%d';

    const points = await BillingLedgerModel.aggregate<{
      _id: string;
      amount: number;
      transaction_count: number;
    }>([
      {
        $match: {
          created_at: { $gte: from, $lte: to },
          status: { $in: ['completed', 'activated', 'paid'] },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format, date: '$created_at' } },
          amount: { $sum: '$amount' },
          transaction_count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return points.map((p) => ({
      date: p._id,
      amount: p.amount,
      transactionCount: p.transaction_count,
    }));
  }

  async getTokenChart(
    startDate?: string,
    endDate?: string,
    interval = 'day',
  ) {
    return this._tokenAnalyticsService.getTokenDateHistogram(startDate, endDate, interval);
  }

  async getTopTenants(
    startDate?: string,
    endDate?: string,
    limit = 5,
  ) {
    const rawTop = await this._tokenAnalyticsService.getTopTenantsByTokens(startDate, endDate, limit);
    if (!rawTop || rawTop.length === 0) {
      return [];
    }

    const tenantIds = rawTop.map((item) => item.tenant_id).filter(Boolean);
    const tenantDocs = await Tenent.find({ _id: { $in: tenantIds } })
      .select('business_name contact_email tier')
      .lean();

    const tenantMap = new Map<string, { business_name: string; email: string; tier: string }>();
    for (const t of tenantDocs) {
      tenantMap.set(t._id.toString(), {
        business_name: t.business_name || '',
        email: t.contact_email || '',
        tier: t.tier || '',
      });
    }

    return rawTop.map((item) => {
      const info = tenantMap.get(item.tenant_id);
      return {
        tenant_id: item.tenant_id,
        business_name: info?.business_name || item.tenant_id,
        email: info?.email || '',
        tier: info?.tier || 'unknown',
        total_tokens: item.total_tokens,
      };
    });
  }

  private _mapDocToItem(doc: Partial<ITierConfigDoc> | TierConfig): TierConfigItem {
    const raw = doc as Record<string, unknown>;
    return {
      id: String(raw._id || raw.id || `tier_${doc.tier}`),
      tier: String(doc.tier || 'starter'),
      name: String(doc.name || doc.tier || 'Starter'),
      max_agents: Number(doc.max_agents ?? 1),
      max_services: Number(doc.max_services ?? 5),
      max_resources: Number(doc.max_resources ?? 3),
      max_kb_docs: Number(doc.max_kb_docs ?? 3),
      max_kb_doc_size_mb: Number(doc.max_kb_doc_size_mb ?? 5),
      weekly_token_limit: Number(doc.weekly_token_limit ?? 100000),
      rate_limit_rpm: Number(doc.rate_limit_rpm ?? 60),
      status: String(doc.status || 'active'),
      description: String(doc.description || ''),
      created_at: raw.created_at ? new Date(String(raw.created_at)).toISOString() : new Date().toISOString(),
      updated_at: raw.updated_at ? new Date(String(raw.updated_at)).toISOString() : new Date().toISOString(),
    };
  }

  async listTierConfigs(): Promise<TierConfigItem[]> {
    const cacheKey = 'tier_config:all';
    try {
      const cached = await this._cacheRepo.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as TierConfigItem[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
  
    }

    const docs = await this._tierConfigRepo.findAll();
    if (!docs || docs.length === 0) {
      const items = Object.values(STATIC_TIER_CONFIGS).map((cfg) => this._mapDocToItem(cfg));
      return items;
    }

    const items = docs.map((doc) => this._mapDocToItem(doc));
    try {
      await this._cacheRepo.set(cacheKey, JSON.stringify(items));
      for (const item of items) {
        await this._cacheRepo.set(`tier_config:${item.tier}`, JSON.stringify(item));
      }
    } catch {
      
    }
    return items;
  }

  async getTierConfig(tier: string): Promise<TierConfigItem> {
    const normalized = (tier || DEFAULT_TIER).trim().toLowerCase();
    const cacheKey = `tier_config:${normalized}`;
    try {
      const cached = await this._cacheRepo.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as TierConfigItem;
      }
    } catch {
  
    }

    const doc = await this._tierConfigRepo.findByTier(normalized);
    if (!doc) {
      const fallback = STATIC_TIER_CONFIGS[normalized] || STATIC_TIER_CONFIGS[DEFAULT_TIER];
      return this._mapDocToItem(fallback);
    }

    const item = this._mapDocToItem(doc);
    try {
      await this._cacheRepo.set(cacheKey, JSON.stringify(item));
    } catch {
      // Non-blocking cache error
    }
    return item;
  }

  async updateTierConfig(tier: string, data: Partial<TierConfigItem>): Promise<TierConfigItem> {
    const normalized = (tier || DEFAULT_TIER).trim().toLowerCase();

    const updatePayload: Record<string, unknown> = {};
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.max_agents !== undefined) updatePayload.max_agents = Number(data.max_agents);
    if (data.max_services !== undefined) updatePayload.max_services = Number(data.max_services);
    if (data.max_resources !== undefined) updatePayload.max_resources = Number(data.max_resources);
    if (data.max_kb_docs !== undefined) updatePayload.max_kb_docs = Number(data.max_kb_docs);
    if (data.max_kb_doc_size_mb !== undefined) updatePayload.max_kb_doc_size_mb = Number(data.max_kb_doc_size_mb);
    if (data.weekly_token_limit !== undefined) updatePayload.weekly_token_limit = Number(data.weekly_token_limit);
    if (data.rate_limit_rpm !== undefined) updatePayload.rate_limit_rpm = Number(data.rate_limit_rpm);
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.description !== undefined) updatePayload.description = data.description;

    const updatedDoc = await this._tierConfigRepo.updateByTier(normalized, updatePayload as any);
    if (!updatedDoc) {
      throw new Error(`Tier configuration for "${normalized}" not found.`);
    }

    const item = this._mapDocToItem(updatedDoc);

    try {
      await this._cacheRepo.set(`tier_config:${normalized}`, JSON.stringify(item));
      await this._cacheRepo.delete('tier_config:all');
    } catch {
   
    }

    return item;
  }
}
