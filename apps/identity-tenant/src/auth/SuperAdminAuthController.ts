import { Controller, UseFilters, Inject } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { SuperAdminService } from "../services/superAdminService.js";
import { AllExceptionsFilter } from "./rpcExpetionFilter.js";

@Controller()
@UseFilters(new AllExceptionsFilter())
export class SuperAdminAuthController {
  constructor(
    @Inject(SuperAdminService)
    private readonly superAdminService: SuperAdminService,
  ) {}

  @GrpcMethod("SuperAdminAuthService", "Login")
  async superAdminLogin(data: any) {
    const { email, password } = data;
    if (!email || !password) throw new Error("Email and password are required");

    const result = await this.superAdminService.login(email, password);
    return {
      message: "SuperAdmin login successful",
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

  @GrpcMethod("SuperAdminAuthService", "RefreshToken")
  async superAdminRefreshToken(data: any) {
    const { refresh_token } = data;
    if (!refresh_token) throw new Error("Refresh token is required");

    const result = await this.superAdminService.refreshToken(refresh_token);
    return {
      message: "Token rotated successfully",
      access_token: result.accessToken,
      refresh_token: result.refreshToken,
    };
  }

  @GrpcMethod("SuperAdminAuthService", "Logout")
  async superAdminLogout(data: any) {
    const { refresh_token } = data;
    await this.superAdminService.logout(refresh_token);
    return { message: "Logged out successfully" };
  }

  @GrpcMethod("SuperAdminAuthService", "GetProfile")
  async superAdminGetProfile(data: any) {
    const { superadmin_id } = data;
    if (!superadmin_id) throw new Error("SuperAdmin ID is required");

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
}
