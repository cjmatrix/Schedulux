import { Controller, UseFilters, Inject } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { DashboardUserService } from "../services/dashboardUserService.js";
import { TenantService } from "../services/tenantService.js";
import { AllExceptionsFilter } from "./rpcExpetionFilter.js";
import {
  DashboardUserLoginRequest,
  DashboardUserLoginResponse,
  InviteUserRequest,
  InviteUserResponse,
  ListWorkspaceUsersRequest,
  ListWorkspaceUsersResponse,
  DashboardUserProfileRequest,
  DashboardUserProfileResponse,
  DashboardUserRefreshTokenRequest,
  DashboardUserRefreshTokenResponse
} from "@repo/proto/dashboard";

@Controller()
@UseFilters(new AllExceptionsFilter())
export class DashboardUserController {
  constructor(
    @Inject(DashboardUserService) private readonly dashboardUserService: DashboardUserService,
    @Inject(TenantService) private readonly tenantService: TenantService,
  ) {}

  @GrpcMethod("DashboardAuthService", "Login")
  async login(data: DashboardUserLoginRequest): Promise<DashboardUserLoginResponse> {
    if (!data.email || !data.password) {
      throw new Error("Email and password are required");
    }
    return await this.dashboardUserService.login(data);
  }

  @GrpcMethod("DashboardAuthService", "GetProfile")
  async getProfile(data: DashboardUserProfileRequest): Promise<DashboardUserProfileResponse> {
    return await this.dashboardUserService.getProfile(data);
  }

  @GrpcMethod("DashboardAuthService", "RefreshToken")
  async refreshToken(data: DashboardUserRefreshTokenRequest): Promise<DashboardUserRefreshTokenResponse> {
    return await this.dashboardUserService.refreshToken(data);
  }

  @GrpcMethod("DashboardUserService", "InviteUser")
  async inviteUser(data: InviteUserRequest): Promise<InviteUserResponse> {
    const { tenant_id, email, name, system_role } = data;
    if (!tenant_id || !email || !name) {
      throw new Error("Missing required fields");
    }
    return await this.tenantService.inviteUser({
      tenant_id,
      email,
      name,
      system_role: system_role as 'root' | 'manager',
    });
  }

  @GrpcMethod("DashboardUserService", "ListWorkspaceUsers")
  async listWorkspaceUsers(data: ListWorkspaceUsersRequest): Promise<ListWorkspaceUsersResponse> {
    if (!data.tenant_id) throw new Error("Tenant ID is required");
    return await this.tenantService.listWorkspaceUsers(data);
  }
}
