import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  OnModuleInit,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientGrpc } from '@nestjs/microservices';
import { TenantServiceClient } from '@repo/proto/tenant';
import { ZodValidationPipe } from 'nestjs-zod';
import { lastValueFrom } from 'rxjs';
import { API_ROUTES } from '../../constants/routes.constant.js';
import { RESPONSE_MESSAGES } from '../../constants/messages.constant.js';
import { getTierConfig, STATIC_TIER_CONFIGS } from '../../constants/tiers.constant.js';
import { PaddleWebhookGuard } from '../../guards/paddle-webhook.guard.js';
import { AuthenticatedTenantRequest, TenantAuthGuard } from '../../guards/tenant-auth.guard.js';
import { RedisService } from '../../services/redis.service.js';
import { PaddleWebhookDto } from './dtos/paddle-webhook.dto.js';
import { CreateCheckoutDto } from './dtos/checkout.dto.js';

@Controller(API_ROUTES.TENANT.BILLING.BASE)
export class BillingController implements OnModuleInit {
  private readonly _logger = new Logger(BillingController.name);
  private _tenantService!: TenantServiceClient;

  constructor(
    @Inject('TENANT_PACKAGE') private readonly _tenantClient: ClientGrpc,
    @Inject(RedisService) private readonly _redisService: RedisService,
    @Inject(ConfigService) private readonly _configService: ConfigService,
  ) {}

  onModuleInit() {
    this._tenantService = this._tenantClient.getService<TenantServiceClient>('TenantService');
  }

  private _getTenantId(req: AuthenticatedTenantRequest): string {
    const tenantId = req.tenant?.tenant_id || req.dashboardUser?.tenant_id;
    if (!tenantId) {
      throw new UnauthorizedException(RESPONSE_MESSAGES.AUTH.TENANT_CONTEXT_MISSING);
    }
    return tenantId;
  }

  @Get("/test")
  getTest(){
    return{
      message:"Successs"
    }
  }

  @Get(API_ROUTES.TENANT.BILLING.CONFIG)
  getPaddleConfig() {
    return {
      message: 'Paddle billing configuration retrieved',
      data: {
        environment: 'sandbox',
        client_token: this._configService.get<string>('PADDLE_CLIENT_TOKEN') || '',
        prices: {
          pro: this._configService.get<string>('PADDLE_PRICE_ID_PRO') || '',
          business: this._configService.get<string>('PADDLE_PRICE_ID_BUSINESS') || '',
          enterprise: this._configService.get<string>('PADDLE_PRICE_ID_ENTERPRISE') || '',
        },
      },
    };
  }

  @Get(API_ROUTES.TENANT.BILLING.SUBSCRIPTION)
  @UseGuards(TenantAuthGuard)
  async getSubscription(@Req() req: AuthenticatedTenantRequest) {
    const tenantId = this._getTenantId(req);

    const [billingInfoRes, weeklyTokens] = await Promise.all([
      lastValueFrom(this._tenantService.getTenantBillingInfo({ tenant_id: tenantId })).catch(
        (err) => {
          this._logger.warn(`Could not get billing info via gRPC: ${err.message}`);
          return {
            tenant_id: tenantId,
            tier: 'starter',
            paddle_customer_id: '',
            paddle_subscription_id: '',
            subscription_status: 'active',
          };
        },
      ),
      this._redisService.getWeeklyTokenUsage(tenantId).catch(() => 0),
    ]);

    const tier = billingInfoRes.tier || 'starter';
    const tierConfig = getTierConfig(tier);

    const usage = {
      weekly_tokens: weeklyTokens || 0,
    };

    return {
      message: 'Tenant subscription details retrieved successfully',
      data: {
        tenant_id: tenantId,
        tier,
        status: billingInfoRes.subscription_status || 'active',
        paddle_customer_id: billingInfoRes.paddle_customer_id || null,
        paddle_subscription_id: billingInfoRes.paddle_subscription_id || null,
        tier_config: tierConfig,
        usage,
        all_tiers: STATIC_TIER_CONFIGS,
      },
    };
  }

  @Post(API_ROUTES.TENANT.BILLING.WEBHOOK)
  @UseGuards(PaddleWebhookGuard)
  @UsePipes(ZodValidationPipe)
  @HttpCode(HttpStatus.OK)
  async handlePaddleWebhook(@Body() dto: PaddleWebhookDto) {
    this._logger.log(
      `Forwarding webhook event to identity-tenant: ${dto.event_type} (${dto.event_id})`,
    );

    const result = await lastValueFrom(
      this._tenantService.processPaddleWebhook({
        event_id: dto.event_id,
        event_type: dto.event_type,
        occurred_at: dto.occurred_at || new Date().toISOString(),
        data_json: JSON.stringify(dto.data),
      }),
    );

    return result;
  }

  @Post(API_ROUTES.TENANT.BILLING.CHECKOUT)
  @UseGuards(TenantAuthGuard)
  @UsePipes(ZodValidationPipe)
  @HttpCode(HttpStatus.OK)
  async createCheckout(
    @Req() req: AuthenticatedTenantRequest,
    @Body() body: CreateCheckoutDto,
  ) {
    const tenantId = this._getTenantId(req);
    const response = await lastValueFrom(
      this._tenantService.createPaddleCheckout({
        tenant_id: tenantId,
        plan: body.plan,
      }),
    );

    if (!response.success) {
      throw new BadRequestException(response.message || 'Failed to initialize Paddle checkout');
    }

    return {
      message: response.message || 'Checkout transaction initialized successfully',
      data: {
        transaction_id: response.transaction_id,
      },
    };
  }
}
