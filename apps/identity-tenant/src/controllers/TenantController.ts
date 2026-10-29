import { Controller, Inject, UseFilters } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  ForgotPasswordRequest,
  LoginRequest,
  LogoutRequest,
  RefreshTokenRequest,
  RegisterRequest,
  ResetPasswordRequest,
  TenantGetProfileRequest,
  TenantGoogleLoginRequest,
  VerifyEmailRequest,
} from '@repo/proto/tenant';
import { GRPC_METHODS, GRPC_SERVICES } from '../constants/grpc.constant.js';
import { RESPONSE_MESSAGES } from '../constants/messages.constant.js';
import type { ITenantService } from '../interfaces/ITenantService.js';
import { AllExceptionsFilter } from './rpcExpetionFilter.js';

@Controller()
@UseFilters(new AllExceptionsFilter())
export class TenantAuthController {
  constructor(
    @Inject('ITenantService') private readonly _tenantService: ITenantService,
  ) {}

  @GrpcMethod(GRPC_SERVICES.TENANT_AUTH, GRPC_METHODS.TENANT_AUTH.REGISTER)
  async register(data: RegisterRequest) {
    const { business_name, full_name, email, password } = data;
    if (!business_name || !full_name || !email || !password) {
      throw new Error(RESPONSE_MESSAGES.ERRORS.MISSING_REQUIRED_FIELDS);
    }
    return await this._tenantService.register({
      business_name,
      full_name,
      email,
      password,
    });
  }

  @GrpcMethod(GRPC_SERVICES.TENANT_AUTH, GRPC_METHODS.TENANT_AUTH.VERIFY_EMAIL)
  async verifyEmail(data: VerifyEmailRequest) {
    const { token } = data;
    if (!token) throw new Error(RESPONSE_MESSAGES.ERRORS.VERIFICATION_TOKEN_REQUIRED);
    return await this._tenantService.verifyEmail(token);
  }

  @GrpcMethod(GRPC_SERVICES.TENANT_AUTH, GRPC_METHODS.TENANT_AUTH.LOGIN)
  async login(data: LoginRequest) {
    const { email, password } = data;
    if (!email || !password) throw new Error(RESPONSE_MESSAGES.ERRORS.EMAIL_AND_PASSWORD_REQUIRED);

    const result = await this._tenantService.login(email, password);
    return {
      message: RESPONSE_MESSAGES.AUTH.LOGIN_SUCCESS,
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

  @GrpcMethod(GRPC_SERVICES.TENANT_AUTH, GRPC_METHODS.TENANT_AUTH.GOOGLE_LOGIN)
  async googleLogin(data: TenantGoogleLoginRequest) {
    const { id_token } = data;
    if (!id_token) throw new Error(RESPONSE_MESSAGES.ERRORS.GOOGLE_ID_TOKEN_REQUIRED_INPUT);

    const result = await this._tenantService.googleLogin(id_token);
    return {
      message: RESPONSE_MESSAGES.AUTH.GOOGLE_LOGIN_SUCCESS,
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

  @GrpcMethod(GRPC_SERVICES.TENANT_AUTH, GRPC_METHODS.TENANT_AUTH.REFRESH_TOKEN)
  async refreshToken(data: RefreshTokenRequest) {
    const { refresh_token } = data;
    if (!refresh_token) throw new Error(RESPONSE_MESSAGES.ERRORS.REFRESH_TOKEN_REQUIRED_INPUT);

    const result = await this._tenantService.refreshToken(refresh_token);
    return {
      message: RESPONSE_MESSAGES.AUTH.TOKEN_ROTATED_SUCCESS,
      access_token: result.accessToken,
      refresh_token: result.refreshToken,
    };
  }

  @GrpcMethod(GRPC_SERVICES.TENANT_AUTH, GRPC_METHODS.TENANT_AUTH.GET_PROFILE)
  async getProfile(data: TenantGetProfileRequest) {
    const { tenant_id } = data;
    if (!tenant_id) throw new Error(RESPONSE_MESSAGES.ERRORS.TENANT_ID_REQUIRED);
    return await this._tenantService.getProfile(tenant_id);
  }

  @GrpcMethod(GRPC_SERVICES.TENANT_AUTH, GRPC_METHODS.TENANT_AUTH.LOGOUT)
  async logout(data: LogoutRequest) {
    const { refresh_token } = data;
    await this._tenantService.logout(refresh_token);
    return { message: RESPONSE_MESSAGES.AUTH.LOGGED_OUT_SUCCESS };
  }

  @GrpcMethod(GRPC_SERVICES.TENANT_AUTH, GRPC_METHODS.TENANT_AUTH.FORGOT_PASSWORD)
  async forgotPassword(data: ForgotPasswordRequest) {
    const { email } = data;
    if (!email) throw new Error(RESPONSE_MESSAGES.ERRORS.EMAIL_REQUIRED);
    return await this._tenantService.forgotPassword(email);
  }

  @GrpcMethod(GRPC_SERVICES.TENANT_AUTH, GRPC_METHODS.TENANT_AUTH.RESET_PASSWORD)
  async resetPassword(data: ResetPasswordRequest) {
    const { token, new_password } = data;
    if (!token || !new_password) throw new Error(RESPONSE_MESSAGES.ERRORS.TOKEN_AND_NEW_PASSWORD_REQUIRED);
    return await this._tenantService.resetPassword(token, new_password);
  }
}

