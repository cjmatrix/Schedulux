import { Controller, UseFilters, Inject } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { TenantService } from "../services/tenantService.js";
import { AllExceptionsFilter } from "./rpcExpetionFilter.js";
import {
  RegisterRequest,
  VerifyEmailRequest,
  LoginRequest,
  TenantGoogleLoginRequest,
  RefreshTokenRequest,
  LogoutRequest,
  TenantGetProfileRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest
} from "@repo/proto/tenant";
import {
  InviteUserRequest,
  ListWorkspaceUsersRequest,
} from "@repo/proto/dashboard";

@Controller()
@UseFilters(new AllExceptionsFilter())
export class TenantAuthController {
  constructor(
    @Inject(TenantService) private readonly tenantService: TenantService,
  ) {}

  @GrpcMethod("TenantAuthService", "Register")
  async register(data: RegisterRequest) {
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
  async verifyEmail(data: VerifyEmailRequest) {
    const { token } = data;
    if (!token) throw new Error("Verification token is required");
    return await this.tenantService.verifyEmail(token);
  }

  @GrpcMethod("TenantAuthService", "Login")
  async login(data: LoginRequest) {
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

  @GrpcMethod("TenantAuthService", "GoogleLogin")
  async googleLogin(data: TenantGoogleLoginRequest) {
    const { id_token } = data;
    if (!id_token) throw new Error("Google ID token is required");

    const result = await this.tenantService.googleLogin(id_token);
    return {
      message: "Google login successful",
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
  async refreshToken(data: RefreshTokenRequest) {
    const { refresh_token } = data;
    if (!refresh_token) throw new Error("Refresh token is required");

    const result = await this.tenantService.refreshToken(refresh_token);
    return {
      message: "Token rotated successfully",
      access_token: result.accessToken,
      refresh_token: result.refreshToken,
    };
  }

  @GrpcMethod("TenantAuthService", "GetProfile")
  async getProfile(data: TenantGetProfileRequest) {
    const { tenant_id } = data;
    if (!tenant_id) throw new Error("Tenant ID is required");
    return await this.tenantService.getProfile(tenant_id);
  }

  @GrpcMethod("TenantAuthService", "Logout")
  async logout(data: LogoutRequest) {
    const { refresh_token } = data;
    await this.tenantService.logout(refresh_token);
    return { message: "Logged out successfully" };
  }

  @GrpcMethod("TenantAuthService", "ForgotPassword")
  async forgotPassword(data: ForgotPasswordRequest) {
    const { email } = data;
    if (!email) throw new Error("Email is required");
    return await this.tenantService.forgotPassword(email);
  }

  @GrpcMethod("TenantAuthService", "ResetPassword")
  async resetPassword(data: ResetPasswordRequest) {
    const { token, new_password } = data;
    if (!token || !new_password) throw new Error("Token and new password are required");
    return await this.tenantService.resetPassword(token, new_password);
  }
}
