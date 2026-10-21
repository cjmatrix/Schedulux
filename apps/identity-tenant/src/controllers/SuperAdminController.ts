import { Controller, Inject, UseFilters } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { SuperAdminProto } from '@repo/proto';
import { ListTenantsRequest, ListTenantsResponse, SuspendTenantRequest } from '@repo/proto/tenant';
import type { ISuperAdminService } from '../interfaces/ISuperAdminService.js';
import { AllExceptionsFilter } from './rpcExpetionFilter.js';

@Controller()
@UseFilters(new AllExceptionsFilter())
export class SuperAdminAuthController {
  constructor(
    @Inject('ISuperAdminService')
    private readonly superAdminService: ISuperAdminService,
  ) {}

  @GrpcMethod('SuperAdminAuthService', 'Login')
  async superAdminLogin(data: SuperAdminProto.LoginRequest) {
    const { email, password } = data;
    if (!email || !password) throw new Error('Email and password are required');

    const result = await this.superAdminService.login(email, password);
    return {
      message: 'SuperAdmin login successful',
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

  @GrpcMethod('SuperAdminAuthService', 'RefreshToken')
  async superAdminRefreshToken(data: SuperAdminProto.RefreshTokenRequest) {
    const { refresh_token } = data;
    if (!refresh_token) throw new Error('Refresh token is required');

    const result = await this.superAdminService.refreshToken(refresh_token);
    return {
      message: 'Token rotated successfully',
      access_token: result.accessToken,
      refresh_token: result.refreshToken,
    };
  }

  @GrpcMethod('SuperAdminAuthService', 'Logout')
  async superAdminLogout(data: SuperAdminProto.LogoutRequest) {
    const { refresh_token } = data;
    await this.superAdminService.logout(refresh_token);
    return { message: 'Logged out successfully' };
  }

  @GrpcMethod('SuperAdminAuthService', 'GetProfile')
  async superAdminGetProfile(data: SuperAdminProto.GetProfileRequest) {
    const { superadmin_id } = data;
    if (!superadmin_id) throw new Error('SuperAdmin ID is required');

    const profile = await this.superAdminService.getProfile(superadmin_id);
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

  @GrpcMethod('TenantService', 'ListTenants')
  async superAdminGetTenantList(data: ListTenantsRequest): Promise<ListTenantsResponse> {
    const lists = await this.superAdminService.ListTenants(data);
    return lists;
  }

  @GrpcMethod('TenantService', 'SuspendTenant')
  async suspendTenant(data: SuspendTenantRequest) {
    if (!data.tenant_id) throw new Error('Tenant ID is required');
    return this.superAdminService.suspendTenant(data.tenant_id);
  }
}
