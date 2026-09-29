import { Controller, UseFilters, Inject } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { TenantService } from "../services/tenantService.js";
import { AllExceptionsFilter } from "./rpcExpetionFilter.js";

@Controller()
@UseFilters(new AllExceptionsFilter())
export class TenantAuthController {
  constructor(
    @Inject(TenantService) private readonly tenantService: TenantService,
  ) {}

  @GrpcMethod("TenantAuthService", "Register")
  async register(data: any) {
    const { business_name, full_name, email, password } = data;
    if (!business_name || !full_name || !email || !password) {
      throw new Error("Missing required fields");
    }
    return await this.tenantService.register({
      business_name,
      full_name,
      email,
      password,
    });
  }

  @GrpcMethod("TenantAuthService", "VerifyEmail")
  async verifyEmail(data: any) {
    const { token } = data;
    if (!token) throw new Error("Verification token is required");
    return await this.tenantService.verifyEmail(token);
  }

  @GrpcMethod("TenantAuthService", "Login")
  async login(data: any) {
    const { email, password } = data;
    if (!email || !password) throw new Error("Email and password are required");

    const result = await this.tenantService.login(email, password);
    return {
      message: "Login successful",
      tenant: {
        tenant_id: result.tenant.tenant_id,
        business_name: result.tenant.business_name,
        contact_email: result.tenant.contact_email,
        tier: result.tenant.tier,
        status: result.tenant.status,
      },
      access_token: result.accessToken,
      refresh_token: result.refreshToken,
    };
  }

  @GrpcMethod("TenantAuthService", "RefreshToken")
  async refreshToken(data: any) {
    const { refresh_token } = data;
    if (!refresh_token) throw new Error("Refresh token is required");

    const result = await this.tenantService.refreshToken(refresh_token);
    return {
      message: "Token rotated successfully",
      access_token: result.accessToken,
      refresh_token: result.refreshToken,
    };
  }

  @GrpcMethod("TenantAuthService", "Logout")
  async logout(data: any) {
    const { refresh_token } = data;
    await this.tenantService.logout(refresh_token);
    return { message: "Logged out successfully" };
  }
}
