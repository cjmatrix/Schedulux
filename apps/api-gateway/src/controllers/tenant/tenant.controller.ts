import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  OnModuleInit,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { DashboardUserServiceClient } from '@repo/proto/dashboard';
import { TenantAuthServiceClient, TenantServiceClient } from '@repo/proto/tenant';
import { Request, Response } from 'express';
import { ZodValidationPipe } from 'nestjs-zod';
import { lastValueFrom } from 'rxjs';
import { COOKIE_NAMES } from '../../constants/cookies.constant.js';
import { RESPONSE_MESSAGES } from '../../constants/messages.constant.js';
import { API_ROUTES } from '../../constants/routes.constant.js';
import { AuthenticatedTenantRequest, TenantAuthGuard } from '../../guards/tenant-auth.guard.js';
import {
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
} from '../../utils/cookie.util.js';
import {
  ForgotPasswordDto,
  InviteUserDto,
  ListWorkspaceUsersDto,
  LogoutDto,
  RefreshTokenDto,
  ResetPasswordDto,
  TenantGoogleLoginDto,
  TenantLoginDto,
  TenantRegisterDto,
  VerifyEmailDto,
} from './dtos/tenant.dto.js';

@Controller(API_ROUTES.TENANT.AUTH.BASE)
export class TenantController implements OnModuleInit {
  private _tenantAuthService!: TenantAuthServiceClient;
  private _tenantServiceClient!: TenantServiceClient;
  private _dashboardUserServiceClient!: DashboardUserServiceClient;

  constructor(
    @Inject('TENANT_PACKAGE') private readonly _client: ClientGrpc,
    @Inject('DASHBOARD_PACKAGE') private readonly _dashboardClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this._tenantAuthService = this._client.getService<TenantAuthServiceClient>('TenantAuthService');
    this._tenantServiceClient = this._client.getService<TenantServiceClient>('TenantService');
    this._dashboardUserServiceClient =
      this._dashboardClient.getService<DashboardUserServiceClient>('DashboardUserService');
  }

  @Get(API_ROUTES.TENANT.AUTH.ME)
  @UseGuards(TenantAuthGuard)
  async getProfile(@Req() req: AuthenticatedTenantRequest) {
    const tenantId = req.tenant?.tenant_id || '';
    const response = await lastValueFrom(
      this._tenantAuthService.getProfile({ tenant_id: tenantId }),
    );
    return {
      message: RESPONSE_MESSAGES.AUTH.PROFILE_RETRIEVED,
      data: response.tenant,
    };
  }

  @Post(API_ROUTES.TENANT.AUTH.REGISTER)
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(ZodValidationPipe)
  async register(@Body() body: TenantRegisterDto) {
    const response = await lastValueFrom(this._tenantAuthService.register(body));
    return {
      message: response.message,
      data: {
        tenant_id: response.tenant_id,
        verification_token: response.verification_token,
      },
    };
  }

  @Post(API_ROUTES.TENANT.AUTH.LOGIN)
  @UsePipes(ZodValidationPipe)
  async login(@Body() body: TenantLoginDto, @Res({ passthrough: true }) res: Response) {
    const response = await lastValueFrom(this._tenantAuthService.login(body));

    res.cookie(COOKIE_NAMES.TENANT_ACCESS_TOKEN, response.access_token, getAccessTokenCookieOptions());
    res.cookie(COOKIE_NAMES.TENANT_REFRESH_TOKEN, response.refresh_token, getRefreshTokenCookieOptions());

    return {
      message: response.message,
      data: response.tenant,
    };
  }

  @Post(API_ROUTES.TENANT.AUTH.GOOGLE)
  @UsePipes(ZodValidationPipe)
  async googleLogin(@Body() body: TenantGoogleLoginDto, @Res({ passthrough: true }) res: Response) {
    const response = await lastValueFrom(
      this._tenantAuthService.googleLogin({ id_token: body.id_token }),
    );

    res.cookie(COOKIE_NAMES.TENANT_ACCESS_TOKEN, response.access_token, getAccessTokenCookieOptions());
    res.cookie(COOKIE_NAMES.TENANT_REFRESH_TOKEN, response.refresh_token, getRefreshTokenCookieOptions());

    return {
      message: response.message,
      data: response.tenant,
    };
  }

  @Get(API_ROUTES.TENANT.AUTH.VERIFY_EMAIL)
  @UsePipes(ZodValidationPipe)
  async verifyEmail(@Query() query: VerifyEmailDto) {
    const response = await lastValueFrom(
      this._tenantAuthService.verifyEmail({ token: query.token }),
    );
    return {
      message: response.message,
      data: { tenant_id: response.tenant_id },
    };
  }

  @Post(API_ROUTES.TENANT.AUTH.REFRESH_TOKEN)
  @UsePipes(ZodValidationPipe)
  async refreshToken(
    @Req() req: Request,
    @Body() body: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.[COOKIE_NAMES.TENANT_REFRESH_TOKEN] || body?.refresh_token || '';
    const response = await lastValueFrom(
      this._tenantAuthService.refreshToken({ refresh_token: token }),
    );

    res.cookie(COOKIE_NAMES.TENANT_ACCESS_TOKEN, response.access_token, getAccessTokenCookieOptions());
    res.cookie(COOKIE_NAMES.TENANT_REFRESH_TOKEN, response.refresh_token, getRefreshTokenCookieOptions());

    return {
      message: response.message,
      data: null,
    };
  }

  @Post(API_ROUTES.TENANT.AUTH.LOGOUT)
  @UsePipes(ZodValidationPipe)
  async logout(
    @Req() req: Request,
    @Body() body: LogoutDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.[COOKIE_NAMES.TENANT_REFRESH_TOKEN] || body?.refresh_token || '';
    if (token) {
      await lastValueFrom(this._tenantAuthService.logout({ refresh_token: token })).catch(() => {});
    }
    res.clearCookie(COOKIE_NAMES.TENANT_ACCESS_TOKEN);
    res.clearCookie(COOKIE_NAMES.TENANT_REFRESH_TOKEN);
    res.clearCookie(COOKIE_NAMES.DASHBOARD_ACCESS_TOKEN);
    res.clearCookie(COOKIE_NAMES.DASHBOARD_REFRESH_TOKEN);
    return {
      message: RESPONSE_MESSAGES.AUTH.LOGGED_OUT,
      data: null,
    };
  }

  @Post(API_ROUTES.TENANT.AUTH.FORGOT_PASSWORD)
  @UsePipes(ZodValidationPipe)
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    const response = await lastValueFrom(this._tenantAuthService.forgotPassword(body));
    return {
      message: response.message,
      data: null,
    };
  }

  @Post(API_ROUTES.TENANT.AUTH.RESET_PASSWORD)
  @UsePipes(ZodValidationPipe)
  async resetPassword(@Body() body: ResetPasswordDto) {
    const response = await lastValueFrom(
      this._tenantAuthService.resetPassword({
        token: body.token,
        new_password: body.new_password,
      }),
    );
    return {
      message: response.message,
      data: null,
    };
  }

  @Post(API_ROUTES.TENANT.AUTH.INVITE_USER)
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(ZodValidationPipe)
  async inviteUser(@Body() body: InviteUserDto) {
    const response = await lastValueFrom(this._dashboardUserServiceClient.inviteUser(body));
    return {
      message: response.message,
      data: {
        user_id: response.user_id,
        email: response.email,
        name: response.name,
        system_role: response.system_role,
      },
    };
  }

  @Get(API_ROUTES.TENANT.AUTH.WORKSPACE_USERS)
  @UsePipes(ZodValidationPipe)
  async listWorkspaceUsers(@Query() query: ListWorkspaceUsersDto) {
    const response = await lastValueFrom(
      this._dashboardUserServiceClient.listWorkspaceUsers({
        tenant_id: query.tenant_id,
        page: query.page,
        limit: query.limit,
        search: query.search,
        role: query.role,
      }),
    );
    return {
      message: RESPONSE_MESSAGES.TENANT.WORKSPACE_USERS_RETRIEVED,
      data: response,
    };
  }
}

