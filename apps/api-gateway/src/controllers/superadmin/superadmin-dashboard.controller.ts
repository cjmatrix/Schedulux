import {
  Controller,
  Get,
  Inject,
  Logger,
  OnModuleInit,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { KnowledgeServiceClient } from '@repo/proto/knowledge';
import { SuperAdminDashboardServiceClient } from '@repo/proto/superadmin';
import { TenantServiceClient } from '@repo/proto/tenant';
import { ZodValidationPipe } from 'nestjs-zod';
import { catchError, lastValueFrom, of } from 'rxjs';
import { RESPONSE_MESSAGES } from '../../constants/messages.constant.js';
import { API_ROUTES } from '../../constants/routes.constant.js';
import { SuperAdminAuthGuard } from '../../guards/superadmin-auth.guard.js';
import { OpenSearchAnalyticsService } from '../../services/opensearch-analytics.service.js';
import {
  DashboardDateQueryDto,
  RevenueChartQueryDto,
  TokenChartQueryDto,
  TopTenantsQueryDto,
} from './dtos/dashboard.dto.js';

@Controller(API_ROUTES.SUPERADMIN.DASHBOARD.BASE)
@UseGuards(SuperAdminAuthGuard)
export class SuperAdminDashboardController implements OnModuleInit {
  private readonly _logger = new Logger(SuperAdminDashboardController.name);
  private _dashboardClient!: SuperAdminDashboardServiceClient;
  private _knowledgeClient!: KnowledgeServiceClient;
  private _tenantClient!: TenantServiceClient;

  constructor(
    @Inject('SUPERADMIN_PACKAGE') private readonly _superadminClient: ClientGrpc,
    @Inject('KNOWLEDGE_PACKAGE') private readonly _knowledgeClientGrpc: ClientGrpc,
    @Inject('TENANT_PACKAGE') private readonly _tenantClientGrpc: ClientGrpc,
    @Inject(OpenSearchAnalyticsService)
    private readonly _openSearchAnalyticsService: OpenSearchAnalyticsService,
  ) {}

  onModuleInit() {
    this._dashboardClient =
      this._superadminClient.getService<SuperAdminDashboardServiceClient>(
        'SuperAdminDashboardService',
      );
    this._knowledgeClient =
      this._knowledgeClientGrpc.getService<KnowledgeServiceClient>('KnowledgeService');
    this._tenantClient =
      this._tenantClientGrpc.getService<TenantServiceClient>('TenantService');
  }

  @Get(API_ROUTES.SUPERADMIN.DASHBOARD.OVERVIEW)
  @UsePipes(ZodValidationPipe)
  async getOverview(@Query() query: DashboardDateQueryDto) {
    const startDate = query.startDate || '';
    const endDate = query.endDate || '';

    
    const [overviewResult, agentStatsResult, totalTokensResult] = await Promise.all([
      lastValueFrom(
        this._dashboardClient
          .getSuperAdminOverview({
            start_date: startDate,
            end_date: endDate,
          })
          .pipe(
            catchError((err) => {
              this._logger.error('Failed to get superadmin overview from identity-tenant:', err);
              return of({
                total_tenants: 0,
                active_tenants: 0,
                suspended_tenants: 0,
                total_revenue: 0,
                currency: 'USD',
                tenants_by_tier: {},
              });
            }),
          ),
      ),
      lastValueFrom(
        this._knowledgeClient
          .getAgentStats({})
          .pipe(
            catchError((err) => {
              this._logger.error('Failed to get agent stats from AI-orchestration:', err);
              return of({
                total_agents: 0,
                active_agents: 0,
                draft_agents: 0,
              });
            }),
          ),
      ),
      this._openSearchAnalyticsService
        .getTotalTokens(startDate, endDate)
        .catch((err) => {
          this._logger.error('Failed to get total tokens from OpenSearch:', err);
          return 0;
        }),
    ]);

    return {
      message: RESPONSE_MESSAGES.DASHBOARD.OVERVIEW_RETRIEVED,
      data: {
        tenants: {
          total: overviewResult.total_tenants,
          active: overviewResult.active_tenants,
          suspended: overviewResult.suspended_tenants,
          by_tier: overviewResult.tenants_by_tier,
        },
        agents: {
          total: agentStatsResult.total_agents,
          active: agentStatsResult.active_agents,
          draft: agentStatsResult.draft_agents,
        },
        revenue: {
          total: overviewResult.total_revenue,
          currency: overviewResult.currency,
        },
        tokens: {
          total: totalTokensResult,
        },
      },
    };
  }

  @Get(API_ROUTES.SUPERADMIN.DASHBOARD.REVENUE_CHART)
  @UsePipes(ZodValidationPipe)
  async getRevenueChart(@Query() query: RevenueChartQueryDto) {
    const res = await lastValueFrom(
      this._dashboardClient.getRevenueChart({
        start_date: query.startDate || '',
        end_date: query.endDate || '',
        interval: query.interval || 'day',
      }),
    );

    return {
      message: RESPONSE_MESSAGES.DASHBOARD.REVENUE_CHART_RETRIEVED,
      data: res.points || [],
    };
  }

  @Get(API_ROUTES.SUPERADMIN.DASHBOARD.TOKEN_CHART)
  @UsePipes(ZodValidationPipe)
  async getTokenChart(@Query() query: TokenChartQueryDto) {
    const points = await this._openSearchAnalyticsService.getTokenDateHistogram(
      query.startDate,
      query.endDate,
      query.interval,
    );

    return {
      message: RESPONSE_MESSAGES.DASHBOARD.TOKEN_CHART_RETRIEVED,
      data: points,
    };
  }

  @Get(API_ROUTES.SUPERADMIN.DASHBOARD.TOP_TENANTS)
  @UsePipes(ZodValidationPipe)
  async getTopTenants(@Query() query: TopTenantsQueryDto) {
    const topTenants = await this._openSearchAnalyticsService.getTopTenantsByTokens(
      query.startDate,
      query.endDate,
      query.limit,
    );

    if (topTenants.length === 0) {
      return {
        message: RESPONSE_MESSAGES.DASHBOARD.TOP_TENANTS_RETRIEVED,
        data: [],
      };
    }

  
    const tenantIds = topTenants.map((item) => item.tenant_id).filter(Boolean);
    const tenantMap = new Map<string, { business_name: string; email: string; tier: string }>();

    if (tenantIds.length > 0) {
      try {
        const tenantList = await lastValueFrom(
          this._tenantClient.listTenants({
            page: 1,
            limit: tenantIds.length,
            tenant_ids: tenantIds,
          }),
        );
        if (tenantList?.tenants) {
          for (const t of tenantList.tenants) {
            tenantMap.set(t.tenant_id, {
              business_name: t.business_name || '',
              email: t.contact_email || '',
              tier: t.tier || '',
            });
          }
        }
      } catch (err) {
        this._logger.warn('Failed to bulk resolve tenant names for top tenants by IDs:', err);
      }
    }

    const enriched = topTenants.map((item) => {
      const info = tenantMap.get(item.tenant_id);
      return {
        tenant_id: item.tenant_id,
        business_name: info?.business_name || item.tenant_id,
        email: info?.email || '',
        tier: info?.tier || 'unknown',
        total_tokens: item.total_tokens,
      };
    });

    return {
      message: RESPONSE_MESSAGES.DASHBOARD.TOP_TENANTS_RETRIEVED,
      data: enriched,
    };
  }
}
