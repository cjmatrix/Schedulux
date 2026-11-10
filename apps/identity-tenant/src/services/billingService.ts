import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  CreatePaddleCheckoutRequest,
  CreatePaddleCheckoutResponse,
  GetTenantBillingInfoRequest,
  GetTenantBillingInfoResponse,
  PaddleWebhookRequest,
  PaddleWebhookResponse,
  UpdateTenantSubscriptionRequest,
  UpdateTenantSubscriptionResponse,
} from '@repo/proto/tenant';
import type { IBillingService } from '../interfaces/IBillingService.js';
import type { ICacheRepository } from '../interfaces/ICacheRepository.js';
import type { IEmailProducer } from '../interfaces/IEmailProducer.js';
import type { ITenantRepository } from '../interfaces/ITenantRepository.js';
import type { TenantTier } from '../model/Tenent.js';

interface PaddleEventItem {
  price?: {
    id?: string;
    product_id?: string;
  };
}

interface PaddleEventData {
  id?: string;
  status?: string;
  customer_id?: string;
  items?: PaddleEventItem[];
  custom_data?: {
    tenantId?: string;
    tenant_id?: string;
    tier?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

@Injectable()
export class BillingService implements IBillingService {
  private readonly _logger = new Logger(BillingService.name);

  constructor(
    @Inject('ITenantRepository') private readonly _tenantRepo: ITenantRepository,
    @Inject('ICacheRepository') private readonly _cacheRepo: ICacheRepository,
    @Inject(ConfigService) private readonly _configService: ConfigService,
    @Inject('IEmailProducer') private readonly _emailProducer?: IEmailProducer,
  ) {}

  private _resolveTier(eventData: PaddleEventData): TenantTier {
   
    const firstItem = eventData.items?.[0];
    const priceId = firstItem?.price?.id;
    const productId = firstItem?.price?.product_id;

    const proPriceId = this._configService.get<string>('PADDLE_PRICE_ID_PRO');
    const businessPriceId = this._configService.get<string>('PADDLE_PRICE_ID_BUSINESS');
    const enterprisePriceId = this._configService.get<string>('PADDLE_PRICE_ID_ENTERPRISE');

    const proProductId = this._configService.get<string>('PADDLE_PRODUCT_ID_PRO');
    const businessProductId = this._configService.get<string>('PADDLE_PRODUCT_ID_BUSINESS');
    const enterpriseProductId = this._configService.get<string>('PADDLE_PRODUCT_ID_ENTERPRISE');

    if (
      (priceId && priceId === proPriceId) ||
      (productId && productId === proProductId)
    ) {
      return 'pro';
    }

    if (
      (priceId && priceId === businessPriceId) ||
      (productId && productId === businessProductId)
    ) {
      return 'business';
    }

    if (
      (priceId && priceId === enterprisePriceId) ||
      (productId && productId === enterpriseProductId)
    ) {
      return 'enterprise';
    }

    return 'pro';
  }

  private async _findTenant(tenantId?: string, subscriptionId?: string, customerId?: string) {
    if (tenantId) {
      const found = await this._tenantRepo.findByTenantId(tenantId);
      if (found) return found;
    }
    if (subscriptionId) {
      const found = await this._tenantRepo.findByPaddleSubscriptionId(subscriptionId);
      if (found) return found;
    }
    if (customerId) {
      const found = await this._tenantRepo.findByPaddleCustomerId(customerId);
      if (found) return found;
    }
    return null;
  }

  async processPaddleWebhook(request: PaddleWebhookRequest): Promise<PaddleWebhookResponse> {
    const { event_type, event_id, data_json } = request;
    this._logger.log(`Processing Paddle webhook event: ${event_type} (${event_id})`);

    let data: PaddleEventData = {};
    try {
      data = JSON.parse(data_json || '{}');
    } catch (err) {
      this._logger.error(`Failed to parse Paddle event data_json for event ${event_id}`, err);
      return {
        success: false,
        message: 'Invalid JSON payload data',
        event_type,
      };
    }

    const tenantId = data.custom_data?.tenantId || data.custom_data?.tenant_id;
    const subscriptionId = data.id || '';
    const customerId = data.customer_id || '';
    const status = (data.status || 'active').toLowerCase();

    const tenant = await this._findTenant(tenantId, subscriptionId, customerId);

    if (!tenant) {
      this._logger.warn(
        `Webhook ${event_type}: Could not resolve tenant with id="${tenantId}", sub="${subscriptionId}", cust="${customerId}"`,
      );
      return {
        success: false,
        message: 'Tenant not found for webhook event',
        event_type,
      };
    }

    switch (event_type) {
      case 'subscription.created':
      case 'subscription.activated': {
        const tier = this._resolveTier(data);
        this._logger.log(
          `Activating subscription ${subscriptionId} for tenant ${tenant._id} at tier ${tier}`,
        );

        await this._tenantRepo.update(tenant._id, {
          tier,
          paddle_customer_id: customerId || tenant.paddle_customer_id,
          paddle_subscription_id: subscriptionId || tenant.paddle_subscription_id,
          subscription_status: status,
        });

        await this._cacheRepo.set(`tenant:${tenant._id}:tier`, tier, { EX: 86400 * 30 });
        break;
      }

      case 'subscription.updated': {
        const isCanceled = status === 'canceled';
        const effectiveTier = isCanceled ? 'starter' : this._resolveTier(data);

        this._logger.log(
          `Updating subscription ${subscriptionId} for tenant ${tenant._id} to status ${status}, tier ${effectiveTier}`,
        );

        await this._tenantRepo.update(tenant._id, {
          tier: effectiveTier,
          paddle_customer_id: customerId || tenant.paddle_customer_id,
          paddle_subscription_id: subscriptionId || tenant.paddle_subscription_id,
          subscription_status: status,
        });

        await this._cacheRepo.set(`tenant:${tenant._id}:tier`, effectiveTier, { EX: 86400 * 30 });
        break;
      }

      case 'subscription.canceled': {
        this._logger.log(
          `Subscription ${subscriptionId} canceled for tenant ${tenant._id}. Downgrading to starter`,
        );

        await this._tenantRepo.update(tenant._id, {
          tier: 'starter',
          subscription_status: 'canceled',
        });

        await this._cacheRepo.set(`tenant:${tenant._id}:tier`, 'starter', { EX: 86400 * 30 });
        break;
      }

      case 'subscription.past_due': {
        this._logger.warn(
          `Subscription ${subscriptionId} past due for tenant ${tenant._id}`,
        );

        await this._tenantRepo.update(tenant._id, {
          subscription_status: 'past_due',
        });
        break;
      }

      case 'transaction.completed': {
        this._logger.log(
          `Paddle transaction completed for customer ${customerId}, tenant ${tenant._id}`,
        );
        if (customerId && !tenant.paddle_customer_id) {
          await this._tenantRepo.update(tenant._id, {
            paddle_customer_id: customerId,
          });
        }
        break;
      }

      default: {
        this._logger.log(`Unhandled Paddle event type: ${event_type}`);
        break;
      }
    }

    return {
      success: true,
      message: `Event ${event_type} processed successfully`,
      event_type,
    };
  }

  async updateTenantSubscription(
    request: UpdateTenantSubscriptionRequest,
  ): Promise<UpdateTenantSubscriptionResponse> {
    const tenant = await this._tenantRepo.findByTenantId(request.tenant_id);

    if (!tenant) {
      throw new Error(`Tenant not found for id ${request.tenant_id}`);
    }

    const normalizedTier = (request.tier || tenant.tier || 'starter').toLowerCase() as TenantTier;
    const status = request.subscription_status || tenant.subscription_status || 'active';

    const updated = await this._tenantRepo.update(tenant._id, {
      tier: normalizedTier,
      subscription_status: status,
    });
    if (!updated) {
      throw new Error('Failed to update tenant subscription in database');
    }

    await this._cacheRepo.set(`tenant:${tenant._id}:tier`, normalizedTier, {
      EX: 86400 * 30,
    });

    return {
      success: true,
      message: `Tenant subscription successfully updated to ${normalizedTier}`,
      tenant: {
        tenant_id: updated._id,
        business_name: updated.business_name,
        contact_email: updated.contact_email,
        tier: updated.tier,
        status: updated.status,
        paddle_customer_id: updated.paddle_customer_id || '',
        paddle_subscription_id: updated.paddle_subscription_id || '',
        subscription_status: updated.subscription_status || 'active',
      },
    };
  }

  async getTenantBillingInfo(
    request: GetTenantBillingInfoRequest,
  ): Promise<GetTenantBillingInfoResponse> {
    const tenant = await this._tenantRepo.findByTenantId(request.tenant_id);
    if (!tenant) {
      throw new Error(`Tenant not found for id ${request.tenant_id}`);
    }

    await this._cacheRepo.set(`tenant:${tenant._id}:tier`, tenant.tier || 'starter', {
      EX: 86400 * 30,
    });

    return {
      tenant_id: tenant._id,
      tier: tenant.tier || 'starter',
      paddle_customer_id: tenant.paddle_customer_id || '',
      paddle_subscription_id: tenant.paddle_subscription_id || '',
      subscription_status: tenant.subscription_status || 'active',
    };
  }

  async createPaddleCheckout(
    request: CreatePaddleCheckoutRequest,
  ): Promise<CreatePaddleCheckoutResponse> {
    const { tenant_id, plan } = request;

    if (!tenant_id) {
      return {
        success: false,
        transaction_id: '',
        message: 'Tenant ID is required',
      };
    }

    const normalizedPlan = (plan || '').toLowerCase().trim();
    if (!['pro', 'business', 'enterprise'].includes(normalizedPlan)) {
      return {
        success: false,
        transaction_id: '',
        message: `Invalid plan "${plan}". Must be one of: pro, business, enterprise`,
      };
    }

    const priceEnvVar = `PADDLE_PRICE_ID_${normalizedPlan.toUpperCase()}`;
    const priceId = this._configService.get<string>(priceEnvVar);
    if (!priceId) {
      this._logger.error(`Paddle price ID is not configured for ${priceEnvVar}`);
      return {
        success: false,
        transaction_id: '',
        message: `Billing price for ${normalizedPlan} is not configured on the server. Please set ${priceEnvVar}.`,
      };
    }

    const apiKey = this._configService.get<string>('PADDLE_API_KEY');
    if (!apiKey) {
      this._logger.error('PADDLE_API_KEY is not configured on the server');
      return {
        success: false,
        transaction_id: '',
        message: 'PADDLE_API_KEY is not configured on the server',
      };
    }

    const tenant = await this._tenantRepo.findByTenantId(tenant_id);
    if (!tenant) {
      return {
        success: false,
        transaction_id: '',
        message: `Tenant not found for id ${tenant_id}`,
      };
    }

    const paddleEnvironment = this._configService.get<string>('PADDLE_ENVIRONMENT') || 'sandbox';
    const baseUrl =
      paddleEnvironment === 'production'
        ? 'https://api.paddle.com'
        : 'https://sandbox-api.paddle.com';

    const payload: Record<string, unknown> = {
      items: [
        {
          price_id: priceId,
          quantity: 1,
        },
      ],
      custom_data: {
        tenant_id,
      },
    };

    if (tenant.paddle_customer_id) {
      payload.customer_id = tenant.paddle_customer_id;
    }

    try {
      this._logger.log(
        `Creating Paddle transaction for tenant ${tenant_id}, plan ${normalizedPlan}, price ${priceId}`,
      );

      const response = await fetch(`${baseUrl}/transactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = (await response.json()) as {
        data?: { id?: string };
        error?: { message?: string; detail?: string };
      };

      if (!response.ok || !responseData.data?.id) {
        const errorDetail =
          responseData.error?.detail || responseData.error?.message || response.statusText;
        this._logger.error(`Paddle transaction creation failed: ${errorDetail}`);
        return {
          success: false,
          transaction_id: '',
          message: `Paddle API error: ${errorDetail}`,
        };
      }

      this._logger.log(
        `Successfully generated Paddle transaction ${responseData.data.id} for tenant ${tenant_id}`,
      );

      return {
        success: true,
        transaction_id: responseData.data.id,
        message: 'Paddle checkout transaction initialized successfully',
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown network error';
      this._logger.error(`Exception while calling Paddle API: ${errMsg}`, err);
      return {
        success: false,
        transaction_id: '',
        message: `Failed to communicate with Paddle API: ${errMsg}`,
      };
    }
  }
}
