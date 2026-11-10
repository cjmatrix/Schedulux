import { Controller, Inject, UseFilters } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  CreatePaddleCheckoutRequest,
  CreatePaddleCheckoutResponse,
  GetTenantBillingInfoRequest,
  GetTenantBillingInfoResponse,
  PaddleWebhookRequest,
  PaddleWebhookResponse,
  UpdateTenantSubscriptionRequest,
  UpdateTenantSubscriptionResponse,
} from '@repo/proto/tenant';
import { GRPC_METHODS, GRPC_SERVICES } from '../constants/grpc.constant.js';
import type { IBillingService } from '../interfaces/IBillingService.js';
import { AllExceptionsFilter } from './rpcExpetionFilter.js';

@Controller()
@UseFilters(new AllExceptionsFilter())
export class TenantBillingController {
  constructor(
    @Inject('IBillingService')
    private readonly _billingService: IBillingService,
  ) {}

  @GrpcMethod(GRPC_SERVICES.TENANT, GRPC_METHODS.TENANT.UPDATE_SUBSCRIPTION)
  async updateTenantSubscription(
    data: UpdateTenantSubscriptionRequest,
  ): Promise<UpdateTenantSubscriptionResponse> {
    return this._billingService.updateTenantSubscription(data);
  }

  @GrpcMethod(GRPC_SERVICES.TENANT, GRPC_METHODS.TENANT.GET_BILLING_INFO)
  async getTenantBillingInfo(
    data: GetTenantBillingInfoRequest,
  ): Promise<GetTenantBillingInfoResponse> {
    return this._billingService.getTenantBillingInfo(data);
  }

  @GrpcMethod(GRPC_SERVICES.TENANT, GRPC_METHODS.TENANT.PROCESS_PADDLE_WEBHOOK)
  async processPaddleWebhook(
    data: PaddleWebhookRequest,
  ): Promise<PaddleWebhookResponse> {
    return this._billingService.processPaddleWebhook(data);
  }

  @GrpcMethod(GRPC_SERVICES.TENANT, GRPC_METHODS.TENANT.CREATE_PADDLE_CHECKOUT)
  async createPaddleCheckout(
    data: CreatePaddleCheckoutRequest,
  ): Promise<CreatePaddleCheckoutResponse> {
    return this._billingService.createPaddleCheckout(data);
  }
}

