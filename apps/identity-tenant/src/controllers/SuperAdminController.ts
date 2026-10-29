import { Controller, Inject, UseFilters } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { SuperAdminProto } from '@repo/proto';
import { ListTenantsRequest, ListTenantsResponse, SuspendTenantRequest } from '@repo/proto/tenant';
import { GRPC_METHODS, GRPC_SERVICES } from '../constants/grpc.constant.js';
import { RESPONSE_MESSAGES } from '../constants/messages.constant.js';
import type { ISuperAdminService } from '../interfaces/ISuperAdminService.js';
import { AllExceptionsFilter } from './rpcExpetionFilter.js';

@Controller()
@UseFilters(new AllExceptionsFilter())
export class SuperAdminAuthController {
  constructor(
    @Inject('ISuperAdminService')
    private readonly _superAdminService: ISuperAdminService,
  ) {}

  @GrpcMethod(GRPC_SERVICES.SUPERADMIN_AUTH, GRPC_METHODS.SUPERADMIN_AUTH.LOGIN)
  async superAdminLogin(data: SuperAdminProto.LoginRequest) {
    const { email, password } = data;
    if (!email || !password) throw new Error(RESPONSE_MESSAGES.ERRORS.EMAIL_AND_PASSWORD_REQUIRED);

    const result = await this._superAdminService.login(email, password);
    return {
      message: RESPONSE_MESSAGES.AUTH.SUPERADMIN_LOGIN_SUCCESS,
      superAdmin: {
        id: result.superAdmin.id,
        email: result.superAdmin.email,
        name: result.superAdmin.name,
        role: result.superAdmin.role,
        created_at: result.superAdmin.created_at,
      },
      access_token: result.accessToken,
      refresh_token: result.refreshToken,
    };
  }

  @GrpcMethod(GRPC_SERVICES.SUPERADMIN_AUTH, GRPC_METHODS.SUPERADMIN_AUTH.REFRESH_TOKEN)
  async superAdminRefreshToken(data: SuperAdminProto.RefreshTokenRequest) {
    const { refresh_token } = data;
    if (!refresh_token) throw new Error(RESPONSE_MESSAGES.ERRORS.REFRESH_TOKEN_REQUIRED_INPUT);

    const result = await this._superAdminService.refreshToken(refresh_token);
    return {
      message: RESPONSE_MESSAGES.AUTH.TOKEN_ROTATED_SUCCESS,
      access_token: result.accessToken,
      refresh_token: result.refreshToken,
    };
  }

  @GrpcMethod(GRPC_SERVICES.SUPERADMIN_AUTH, GRPC_METHODS.SUPERADMIN_AUTH.LOGOUT)
  async superAdminLogout(data: SuperAdminProto.LogoutRequest) {
    const { refresh_token } = data;
    await this._superAdminService.logout(refresh_token);
    return { message: RESPONSE_MESSAGES.AUTH.LOGGED_OUT_SUCCESS };
  }

  @GrpcMethod(GRPC_SERVICES.SUPERADMIN_AUTH, GRPC_METHODS.SUPERADMIN_AUTH.GET_PROFILE)
  async superAdminGetProfile(data: SuperAdminProto.GetProfileRequest) {
    const { superadmin_id } = data;
    if (!superadmin_id) throw new Error(RESPONSE_MESSAGES.ERRORS.SUPERADMIN_ID_REQUIRED);

    const profile = await this._superAdminService.getProfile(superadmin_id);
    return {
      superAdmin: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        created_at: profile.created_at,
      },
    };
  }

  @GrpcMethod(GRPC_SERVICES.TENANT, GRPC_METHODS.TENANT.LIST_TENANTS)
  async superAdminGetTenantList(data: ListTenantsRequest): Promise<ListTenantsResponse> {
    const lists = await this._superAdminService.ListTenants(data);
    return lists;
  }

  @GrpcMethod(GRPC_SERVICES.TENANT, GRPC_METHODS.TENANT.SUSPEND_TENANT)
  async suspendTenant(data: SuspendTenantRequest) {
    if (!data.tenant_id) throw new Error(RESPONSE_MESSAGES.ERRORS.TENANT_ID_REQUIRED);
    return this._superAdminService.suspendTenant(data.tenant_id);
  }
}

