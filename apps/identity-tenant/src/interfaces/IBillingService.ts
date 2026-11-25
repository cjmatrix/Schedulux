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

export interface IBillingService {
  processPaddleWebhook(request: PaddleWebhookRequest): Promise<PaddleWebhookResponse>;
  updateTenantSubscription(
    request: UpdateTenantSubscriptionRequest,
  ): Promise<UpdateTenantSubscriptionResponse>;
  getTenantBillingInfo(
    request: GetTenantBillingInfoRequest,
  ): Promise<GetTenantBillingInfoResponse>;
  createPaddleCheckout(
    request: CreatePaddleCheckoutRequest,
  ): Promise<CreatePaddleCheckoutResponse>;
}
