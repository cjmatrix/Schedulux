import { Controller, Inject, UseFilters } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  DashboardUserForgotPasswordRequest,
  DashboardUserForgotPasswordResponse,
  DashboardUserLoginRequest,
  DashboardUserLoginResponse,
  DashboardUserProfileRequest,
  DashboardUserProfileResponse,
  DashboardUserRefreshTokenRequest,
  DashboardUserRefreshTokenResponse,
  DashboardUserResetPasswordRequest,
  DashboardUserResetPasswordResponse,
  InviteUserRequest,
  InviteUserResponse,
  ListWorkspaceUsersRequest,
  ListWorkspaceUsersResponse,
} from '@repo/proto/dashboard';
import { GRPC_METHODS, GRPC_SERVICES } from '../constants/grpc.constant.js';
import { RESPONSE_MESSAGES } from '../constants/messages.constant.js';
import type { IDashboardUserService } from '../interfaces/IDashboardUserService.js';
import type { ITenantService } from '../interfaces/ITenantService.js';
import { AllExceptionsFilter } from './rpcExpetionFilter.js';

@Controller()
@UseFilters(new AllExceptionsFilter())
export class DashboardUserController {
  constructor(
    @Inject('IDashboardUserService') private readonly _dashboardUserService: IDashboardUserService,
    @Inject('ITenantService') private readonly _tenantService: ITenantService,
  ) {}

  @GrpcMethod(GRPC_SERVICES.DASHBOARD_AUTH, GRPC_METHODS.DASHBOARD_AUTH.LOGIN)
  async login(data: DashboardUserLoginRequest): Promise<DashboardUserLoginResponse> {
    if (!data.email || !data.password) {
      throw new Error(RESPONSE_MESSAGES.ERRORS.EMAIL_AND_PASSWORD_REQUIRED);
    }
    return await this._dashboardUserService.login(data);
  }

  @GrpcMethod(GRPC_SERVICES.DASHBOARD_AUTH, GRPC_METHODS.DASHBOARD_AUTH.GET_PROFILE)
  async getProfile(data: DashboardUserProfileRequest): Promise<DashboardUserProfileResponse> {
    return await this._dashboardUserService.getProfile(data);
  }

  @GrpcMethod(GRPC_SERVICES.DASHBOARD_AUTH, GRPC_METHODS.DASHBOARD_AUTH.REFRESH_TOKEN)
  async refreshToken(
    data: DashboardUserRefreshTokenRequest,
  ): Promise<DashboardUserRefreshTokenResponse> {
    return await this._dashboardUserService.refreshToken(data);
  }

  @GrpcMethod(GRPC_SERVICES.DASHBOARD_AUTH, GRPC_METHODS.DASHBOARD_AUTH.FORGOT_PASSWORD)
  async forgotPassword(
    data: DashboardUserForgotPasswordRequest,
  ): Promise<DashboardUserForgotPasswordResponse> {
    if (!data.email) throw new Error(RESPONSE_MESSAGES.ERRORS.EMAIL_REQUIRED);
    return await this._dashboardUserService.forgotPassword(data.email);
  }

  @GrpcMethod(GRPC_SERVICES.DASHBOARD_AUTH, GRPC_METHODS.DASHBOARD_AUTH.RESET_PASSWORD)
  async resetPassword(
    data: DashboardUserResetPasswordRequest,
  ): Promise<DashboardUserResetPasswordResponse> {
    if (!data.token || !data.new_password) throw new Error(RESPONSE_MESSAGES.ERRORS.TOKEN_AND_NEW_PASSWORD_REQUIRED);
    return await this._dashboardUserService.resetPassword(data.token, data.new_password);
  }

  @GrpcMethod(GRPC_SERVICES.DASHBOARD_USER, GRPC_METHODS.DASHBOARD_USER.INVITE_USER)
  async inviteUser(data: InviteUserRequest): Promise<InviteUserResponse> {
    const { tenant_id, email, name, system_role } = data;
    if (!tenant_id || !email || !name) {
      throw new Error(RESPONSE_MESSAGES.ERRORS.MISSING_REQUIRED_FIELDS);
    }
    return await this._tenantService.inviteUser({
      tenant_id,
      email,
      name,
      system_role: system_role as 'root' | 'manager',
    });
  }

  @GrpcMethod(GRPC_SERVICES.DASHBOARD_USER, GRPC_METHODS.DASHBOARD_USER.LIST_WORKSPACE_USERS)
  async listWorkspaceUsers(data: ListWorkspaceUsersRequest): Promise<ListWorkspaceUsersResponse> {
    if (!data.tenant_id) throw new Error(RESPONSE_MESSAGES.ERRORS.TENANT_ID_REQUIRED);
    return await this._tenantService.listWorkspaceUsers(data);
  }
}

