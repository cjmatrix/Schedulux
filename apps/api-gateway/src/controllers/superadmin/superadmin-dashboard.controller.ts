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
import { ZodValidationPipe } from 'nestjs-zod';
import { catchError, lastValueFrom, of } from 'rxjs';
import { RESPONSE_MESSAGES } from '../../constants/messages.constant.js';
import { API_ROUTES } from '../../constants/routes.constant.js';
import { SuperAdminAuthGuard } from '../../guards/superadmin-auth.guard.js';
import {
  DashboardDateQueryDto,
  RevenueChartQueryDto,
  TokenChartQueryDto,
  TopTenantsQueryDto,
} from './dtos/dashboard.dto.js';
import { CIRCUIT_BREAKER_SERVICE, ICircuitBreakerService } from '@repo/circuit-breaker';

@Controller(API_ROUTES.SUPERADMIN.DASHBOARD.BASE)
@UseGuards(SuperAdminAuthGuard)
export class SuperAdminDashboardController implements OnModuleInit {
  private readonly _logger = new Logger(SuperAdminDashboardController.name);
  private _dashboardClient!: SuperAdminDashboardServiceClient;
  private _knowledgeClient!: KnowledgeServiceClient;

  constructor(
    @Inject('SUPERADMIN_PACKAGE') private readonly _superadminClient: ClientGrpc,
    @Inject('KNOWLEDGE_PACKAGE') private readonly _knowledgeClientGrpc: ClientGrpc,
    @Inject(CIRCUIT_BREAKER_SERVICE)
    private readonly _circuitBreakerService: ICircuitBreakerService,
  ) {}

  onModuleInit() {
    this._dashboardClient = this._circuitBreakerService.wrapGrpcClient(
      'superadmin-service',
      this._superadminClient.getService<SuperAdminDashboardServiceClient>(
        'SuperAdminDashboardService',
      ),
    );
    this._knowledgeClient = this._circuitBreakerService.wrapGrpcClient(
      'knowledge-data',
      this._knowledgeClientGrpc.getService<KnowledgeServiceClient>('KnowledgeService'),
    );
  }

  @Get(API_ROUTES.SUPERADMIN.DASHBOARD.OVERVIEW)
  @UsePipes(ZodValidationPipe)
  async getOverview(@Query() query: DashboardDateQueryDto) {
    const startDate = query.startDate || '';
    const endDate = query.endDate || '';

    const [overviewResult, agentStatsResult] = await Promise.all([
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
                total_tokens: 0,
              });
            }),
          ),
      ),
      lastValueFrom(
        this._knowledgeClient.getAgentStats({}).pipe(
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
          total: Number(overviewResult.total_tokens) || 0,
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
    const res = await lastValueFrom(
      this._dashboardClient.getTokenChart({
        start_date: query.startDate || '',
        end_date: query.endDate || '',
        interval: query.interval || 'day',
      }),
    );

    return {
      message: RESPONSE_MESSAGES.DASHBOARD.TOKEN_CHART_RETRIEVED,
      data: (res.points || []).map((p) => ({
        date: p.date,
        total_tokens: Number(p.total_tokens) || 0,
        input_tokens: Number(p.input_tokens) || 0,
        output_tokens: Number(p.output_tokens) || 0,
      })),
    };
  }

  @Get(API_ROUTES.SUPERADMIN.DASHBOARD.TOP_TENANTS)
  @UsePipes(ZodValidationPipe)
  async getTopTenants(@Query() query: TopTenantsQueryDto) {
    const res = await lastValueFrom(
      this._dashboardClient.getTopTenants({
        start_date: query.startDate || '',
        end_date: query.endDate || '',
        limit: query.limit || 5,
      }),
    );

    return {
      message: RESPONSE_MESSAGES.DASHBOARD.TOP_TENANTS_RETRIEVED,
      data: (res.tenants || []).map((t) => ({
        tenant_id: t.tenant_id,
        business_name: t.business_name,
        email: t.email,
        tier: t.tier,
        total_tokens: Number(t.total_tokens) || 0,
      })),
    };
  }
}
