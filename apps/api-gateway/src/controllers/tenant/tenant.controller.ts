import { Controller, Post, Get, Body, Query, Req, Res, Inject, OnModuleInit, UsePipes, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Request, Response } from 'express';
import { Observable, lastValueFrom } from 'rxjs';
import { ZodValidationPipe } from 'nestjs-zod';
import { TenantRegisterDto, TenantLoginDto, TenantGoogleLoginDto, InviteUserDto, VerifyEmailDto, RefreshTokenDto, LogoutDto, ListWorkspaceUsersDto, ForgotPasswordDto, ResetPasswordDto } from './dtos/tenant.dto.js';
import { TenantAuthServiceClient, TenantServiceClient } from '@repo/proto/tenant';
import { DashboardUserServiceClient } from '@repo/proto/dashboard';
import { TenantAuthGuard, AuthenticatedTenantRequest } from '../../guards/tenant-auth.guard.js';
import { getAccessTokenCookieOptions, getRefreshTokenCookieOptions } from '../../utils/cookie.util.js';

@Controller('api/v1/tenant/auth')
export class TenantController implements OnModuleInit {
  private tenantAuthService!: TenantAuthServiceClient;
  private tenantServiceClient!: TenantServiceClient;
  private dashboardUserServiceClient!: DashboardUserServiceClient;

  constructor(
    @Inject('TENANT_PACKAGE') private client: ClientGrpc,
    @Inject('DASHBOARD_PACKAGE') private dashboardClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.tenantAuthService = this.client.getService<TenantAuthServiceClient>('TenantAuthService');
    this.tenantServiceClient = this.client.getService<TenantServiceClient>('TenantService');
    this.dashboardUserServiceClient = this.dashboardClient.getService<DashboardUserServiceClient>('DashboardUserService');
  }

  @Get('me')
  @UseGuards(TenantAuthGuard)
  async getProfile(@Req() req: AuthenticatedTenantRequest) {
    const tenantId = req.tenant?.tenant_id || '';
    const response = await lastValueFrom(this.tenantAuthService.getProfile({ tenant_id: tenantId }));
    return {
      message: 'Profile retrieved successfully',
      data: response.tenant,
    };
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(ZodValidationPipe)
  async register(@Body() body: TenantRegisterDto) {
    const response = await lastValueFrom(this.tenantAuthService.register(body));
    return {
      message: response.message,
      data: {
        tenant_id: response.tenant_id,
        verification_token: response.verification_token,
      },
    };
  }
  
  @Post('login')
  @UsePipes(ZodValidationPipe)
  async login(@Body() body: TenantLoginDto, @Res({ passthrough: true }) res: Response) {
    const response = await lastValueFrom(this.tenantAuthService.login(body));

    res.cookie('access_token', response.access_token, getAccessTokenCookieOptions());
    res.cookie('refresh_token', response.refresh_token, getRefreshTokenCookieOptions());

    return {
      message: response.message,
      data: response.tenant,
    };
  }

  @Post('google')
  @UsePipes(ZodValidationPipe)
  async googleLogin(@Body() body: TenantGoogleLoginDto, @Res({ passthrough: true }) res: Response) {
    const response = await lastValueFrom(this.tenantAuthService.googleLogin({ id_token: body.id_token }));

    res.cookie('access_token', response.access_token, getAccessTokenCookieOptions());
    res.cookie('refresh_token', response.refresh_token, getRefreshTokenCookieOptions());

    return {
      message: response.message,
      data: response.tenant,
    };
  }

  @Get('verify-email')
  @UsePipes(ZodValidationPipe)
  async verifyEmail(@Query() query: VerifyEmailDto) {
    const response = await lastValueFrom(this.tenantAuthService.verifyEmail({ token: query.token }));
    return {
      message: response.message,
      data: { tenant_id: response.tenant_id },
    };
  }

  @Post('refresh-token')
  @UsePipes(ZodValidationPipe)
  async refreshToken(
    @Req() req: Request,
    @Body() body: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.refresh_token || body?.refresh_token || '';
    const response = await lastValueFrom(this.tenantAuthService.refreshToken({ refresh_token: token }));

    res.cookie('access_token', response.access_token, getAccessTokenCookieOptions());
    res.cookie('refresh_token', response.refresh_token, getRefreshTokenCookieOptions());

    return {
      message: response.message,
      data: null,
    };
  }

  @Post('logout')
  @UsePipes(ZodValidationPipe)
  async logout(
    @Req() req: Request,
    @Body() body: LogoutDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.refresh_token || body?.refresh_token || '';
    if (token) {
      await lastValueFrom(this.tenantAuthService.logout({ refresh_token: token })).catch(() => {});
    }
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    res.clearCookie('dashboarduser_access_token');
    res.clearCookie('dashboarduser_refresh_token');
    return {
      message: 'Logged out successfully',
      data: null,
    };
  }

  @Post('forgot-password')
  @UsePipes(ZodValidationPipe)
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    const response = await lastValueFrom(this.tenantAuthService.forgotPassword(body));
    return {
      message: response.message,
      data: null,
    };
  }

  @Post('reset-password')
  @UsePipes(ZodValidationPipe)
  async resetPassword(@Body() body: ResetPasswordDto) {
    const response = await lastValueFrom(this.tenantAuthService.resetPassword({
      token: body.token,
      new_password: body.new_password
    }));
    return {
      message: response.message,
      data: null,
    };
  }

  @Post('invite-user')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(ZodValidationPipe)
  async inviteUser(@Body() body: InviteUserDto) {
    const response = await lastValueFrom(this.dashboardUserServiceClient.inviteUser(body));
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

  @Get('workspace-users')
  @UsePipes(ZodValidationPipe)
  async listWorkspaceUsers(@Query() query: ListWorkspaceUsersDto) {
    const response = await lastValueFrom(
      this.dashboardUserServiceClient.listWorkspaceUsers({
        tenant_id: query.tenant_id,
        page: query.page,
        limit: query.limit,
        search: query.search,
        role: query.role,
      })
    );
    return {
      message: 'Workspace users retrieved successfully',
      data: response,
    };
  }
}
