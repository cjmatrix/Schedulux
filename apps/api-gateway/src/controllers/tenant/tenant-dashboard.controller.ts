import {
  Controller,
  Get,
  Inject,
  Logger,
  OnModuleInit,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { KnowledgeServiceClient } from '@repo/proto/knowledge';
import {
  SCHEDULING_INVENTORY_SERVICE_NAME,
  SchedulingInventoryServiceClient,
} from '@repo/proto/scheduling';
import { ZodValidationPipe } from 'nestjs-zod';
import { catchError, lastValueFrom, of } from 'rxjs';
import { RESPONSE_MESSAGES } from '../../constants/messages.constant.js';
import { API_ROUTES } from '../../constants/routes.constant.js';
import { STATIC_TIER_CONFIGS } from '../../constants/tiers.constant.js';
import { Roles } from '../../decorators/roles.decorator.js';
import { RolesGuard } from '../../guards/roles.guard.js';
import {
  AuthenticatedTenantRequest,
  TenantAuthGuard,
} from '../../guards/tenant-auth.guard.js';
import { RedisService } from '../../services/redis.service.js';
import { TenantDashboardOverviewDto } from './dtos/tenant.dto.js';

@Controller(API_ROUTES.TENANT.DASHBOARD.BASE)
@UseGuards(TenantAuthGuard, RolesGuard)
export class TenantDashboardController implements OnModuleInit {
  private readonly _logger = new Logger(TenantDashboardController.name);
  private _knowledgeService!: KnowledgeServiceClient;
  private _schedulingService!: SchedulingInventoryServiceClient;

  constructor(
    @Inject('KNOWLEDGE_PACKAGE') private readonly _knowledgeClient: ClientGrpc,
    @Inject('SCHEDULING_PACKAGE') private readonly _schedulingClient: ClientGrpc,
    @Inject(RedisService) private readonly _redisService: RedisService,
  ) {}

  onModuleInit() {
    this._knowledgeService =
      this._knowledgeClient.getService<KnowledgeServiceClient>('KnowledgeService');
    this._schedulingService =
      this._schedulingClient.getService<SchedulingInventoryServiceClient>(
        SCHEDULING_INVENTORY_SERVICE_NAME,
      );
  }

  @Get(API_ROUTES.TENANT.DASHBOARD.OVERVIEW)
  @Roles('tenant_owner', 'manager')
  @UsePipes(ZodValidationPipe)
  async getOverview(
    @Req() req: AuthenticatedTenantRequest,
    @Query() query: TenantDashboardOverviewDto,
  ) {
    const tenantId = req.tenant?.tenant_id || req.dashboardUser?.tenant_id;
    if (!tenantId) {
      throw new UnauthorizedException(RESPONSE_MESSAGES.AUTH.TENANT_ID_REQUIRED);
    }

    const tier = (req.tenant?.tier || req.dashboardUser?.tier || 'starter').toLowerCase();
    const tierConfig = STATIC_TIER_CONFIGS[tier] || STATIC_TIER_CONFIGS.starter;

    const agentsRes = await lastValueFrom(
      this._knowledgeService
        .listTenantAgents({ tenant_id: tenantId })
        .pipe(
          catchError((err) => {
            this._logger.error('Failed to list tenant agents:', err);
            return of({ agents: [] });
          }),
        ),
    );

    const agentsList = agentsRes?.agents || [];
    const targetAgentId =
      req.dashboardUser?.agent_id || query.agent_id || agentsList[0]?.agent_id;

    const activeAgent =
      agentsList.find((a) => a.agent_id === targetAgentId) ||
      (agentsList.length > 0 ? agentsList[0] : null);

    if (!activeAgent) {
      const tokenUsage = await this._redisService.getWeeklyTokenUsage(tenantId).catch(() => 0);
      return {
        message: RESPONSE_MESSAGES.TENANT.DASHBOARD_OVERVIEW_RETRIEVED,
        data: {
          agent: null,
          agents_list: [],
          inventory: {
            total_services: 0,
            total_resources: 0,
            recent_services: [],
          },
          bookings: {
            total: 0,
            confirmed: 0,
            pending: 0,
            recent: [],
          },
          knowledge: {
            total_documents: 0,
          },
          tokens: {
            used_this_week: tokenUsage,
            weekly_limit: tierConfig.weekly_token_limit,
          },
          tier: {
            name: tierConfig.name,
            tier: tierConfig.tier,
            max_services: tierConfig.max_services,
            weekly_token_limit: tierConfig.weekly_token_limit,
          },
        },
      };
    }

    const [
      bookingsRes,
      confirmedBookingsRes,
      servicesRes,
      resourcesRes,
      documentsRes,
      tokenUsage,
    ] = await Promise.all([
      lastValueFrom(
        this._schedulingService
          .listBookings({
            tenant_id: tenantId,
            agent_id: activeAgent.agent_id,
            page: 1,
            limit: 5,
          })
          .pipe(
            catchError((err) => {
              this._logger.error('Failed to list agent bookings:', err);
              return of({ bookings: [], total: 0, page: 1, limit: 5 });
            }),
          ),
      ),
      lastValueFrom(
        this._schedulingService
          .listBookings({
            tenant_id: tenantId,
            agent_id: activeAgent.agent_id,
            page: 1,
            limit: 1,
            status: 'confirmed',
          })
          .pipe(
            catchError((err) => {
              this._logger.error('Failed to count confirmed agent bookings:', err);
              return of({ bookings: [], total: 0, page: 1, limit: 1 });
            }),
          ),
      ),
      lastValueFrom(
        this._schedulingService
          .listServices({
            tenant_id: tenantId,
            agent_id: activeAgent.agent_id,
            page: 1,
            limit: 5,
            category: '',
          })
          .pipe(
            catchError((err) => {
              this._logger.error('Failed to list agent services:', err);
              return of({ services: [], total: 0, page: 1, limit: 5 });
            }),
          ),
      ),
      lastValueFrom(
        this._schedulingService
          .listResources({
            tenant_id: tenantId,
            agent_id: activeAgent.agent_id,
            page: 1,
            limit: 1,
            resource_type: '',
            dispatch_status: '',
          })
          .pipe(
            catchError((err) => {
              this._logger.error('Failed to list agent resources count:', err);
              return of({ resources: [], total: 0, page: 1, limit: 1 });
            }),
          ),
      ),
      lastValueFrom(
        this._knowledgeService
          .listDocuments({
            tenant_id: tenantId,
            agent_id: activeAgent.agent_id,
          })
          .pipe(
            catchError((err) => {
              this._logger.error('Failed to list agent documents:', err);
              return of({ documents: [] });
            }),
          ),
      ),
      this._redisService.getWeeklyTokenUsage(tenantId).catch(() => 0),
    ]);

    const totalBookings = bookingsRes?.total || 0;
    const confirmedBookings = confirmedBookingsRes?.total || 0;
    const pendingBookings = Math.max(0, totalBookings - confirmedBookings);

    const recentBookings = (bookingsRes?.bookings || []).map((b) => ({
      booking_id: b.booking_id,
      booking_reference: b.booking_reference,
      customer_name: b.customer?.name || 'Walk-in Customer',
      customer_phone: b.customer?.phone || '',
      start_time: b.start_time,
      end_time: b.end_time,
      status: b.status,
      source: b.source,
    }));

    const recentServices = (servicesRes?.services || []).map((s) => ({
      service_id: s.service_id,
      name: s.name,
      category: s.category || 'General',
      duration_minutes: s.duration_minutes || 30,
      price: s.price
        ? {
            amount: s.price.amount || 0,
            currency: s.price.currency || 'USD',
          }
        : undefined,
    }));

    return {
      message: RESPONSE_MESSAGES.TENANT.DASHBOARD_OVERVIEW_RETRIEVED,
      data: {
        agent: {
          agent_id: activeAgent.agent_id,
          name: activeAgent.name,
          status: activeAgent.status,
          creation_source: activeAgent.creation_source,
          created_at: activeAgent.created_at,
          updated_at: activeAgent.updated_at,
        },
        agents_list: agentsList.map((a) => ({
          agent_id: a.agent_id,
          name: a.name,
          status: a.status,
        })),
        inventory: {
          total_services: servicesRes?.total || 0,
          total_resources: resourcesRes?.total || 0,
          recent_services: recentServices,
        },
        bookings: {
          total: totalBookings,
          confirmed: confirmedBookings,
          pending: pendingBookings,
          recent: recentBookings,
        },
        knowledge: {
          total_documents: documentsRes?.documents?.length || 0,
        },
        tokens: {
          used_this_week: tokenUsage,
          weekly_limit: tierConfig.weekly_token_limit,
        },
        tier: {
          name: tierConfig.name,
          tier: tierConfig.tier,
          max_services: tierConfig.max_services,
          weekly_token_limit: tierConfig.weekly_token_limit,
        },
      },
    };
  }
}
