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
import type { IDashboardUserService } from '../interfaces/IDashboardUserService.js';
import type { ITenantService } from '../interfaces/ITenantService.js';
import { AllExceptionsFilter } from './rpcExpetionFilter.js';

@Controller()
@UseFilters(new AllExceptionsFilter())
export class DashboardUserController {
  constructor(
    @Inject('IDashboardUserService') private readonly dashboardUserService: IDashboardUserService,
    @Inject('ITenantService') private readonly tenantService: ITenantService,
  ) {}

  @GrpcMethod('DashboardAuthService', 'Login')
  async login(data: DashboardUserLoginRequest): Promise<DashboardUserLoginResponse> {
    if (!data.email || !data.password) {
      throw new Error('Email and password are required');
    }
    return await this.dashboardUserService.login(data);
  }

  @GrpcMethod('DashboardAuthService', 'GetProfile')
  async getProfile(data: DashboardUserProfileRequest): Promise<DashboardUserProfileResponse> {
    return await this.dashboardUserService.getProfile(data);
  }

  @GrpcMethod('DashboardAuthService', 'RefreshToken')
  async refreshToken(
    data: DashboardUserRefreshTokenRequest,
  ): Promise<DashboardUserRefreshTokenResponse> {
    return await this.dashboardUserService.refreshToken(data);
  }

  @GrpcMethod('DashboardAuthService', 'ForgotPassword')
  async forgotPassword(
    data: DashboardUserForgotPasswordRequest,
  ): Promise<DashboardUserForgotPasswordResponse> {
    if (!data.email) throw new Error('Email is required');
    return await this.dashboardUserService.forgotPassword(data.email);
  }

  @GrpcMethod('DashboardAuthService', 'ResetPassword')
  async resetPassword(
    data: DashboardUserResetPasswordRequest,
  ): Promise<DashboardUserResetPasswordResponse> {
    if (!data.token || !data.new_password) throw new Error('Token and new password are required');
    return await this.dashboardUserService.resetPassword(data.token, data.new_password);
  }

  @GrpcMethod('DashboardUserService', 'InviteUser')
  async inviteUser(data: InviteUserRequest): Promise<InviteUserResponse> {
    const { tenant_id, email, name, system_role } = data;
    if (!tenant_id || !email || !name) {
      throw new Error('Missing required fields');
    }
    return await this.tenantService.inviteUser({
      tenant_id,
      email,
      name,
      system_role: system_role as 'root' | 'manager',
    });
  }

  @GrpcMethod('DashboardUserService', 'ListWorkspaceUsers')
  async listWorkspaceUsers(data: ListWorkspaceUsersRequest): Promise<ListWorkspaceUsersResponse> {
    if (!data.tenant_id) throw new Error('Tenant ID is required');
    return await this.tenantService.listWorkspaceUsers(data);
  }
}
