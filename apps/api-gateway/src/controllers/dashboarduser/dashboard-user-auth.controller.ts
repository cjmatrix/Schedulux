import {
  Body,
  Controller,
  Get,
  Inject,
  OnModuleInit,
  Post,
  Req,
  Res,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { DashboardAuthServiceClient } from '@repo/proto/dashboard';
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
  DashboardUserForgotPasswordDto,
  DashboardUserLoginDto,
  DashboardUserRefreshTokenDto,
  DashboardUserResetPasswordDto,
} from './dtos/dashboard-user.dto.js';

@Controller(API_ROUTES.DASHBOARD_USER.AUTH.BASE)
export class DashboardUserAuthController implements OnModuleInit {
  private _dashboardUserAuthClient!: DashboardAuthServiceClient;

  constructor(@Inject('DASHBOARD_PACKAGE') private readonly _client: ClientGrpc) {}

  onModuleInit() {
    this._dashboardUserAuthClient = this._client.getService('DashboardAuthService');
  }

  @Post(API_ROUTES.DASHBOARD_USER.AUTH.LOGIN)
  @UsePipes(ZodValidationPipe)
  async Login(@Body() data: DashboardUserLoginDto, @Res({ passthrough: true }) res: Response) {
    const response = await lastValueFrom(this._dashboardUserAuthClient.login(data));

    res.cookie(COOKIE_NAMES.DASHBOARD_ACCESS_TOKEN, response.access_token, getAccessTokenCookieOptions());
    res.cookie(
      COOKIE_NAMES.DASHBOARD_REFRESH_TOKEN,
      response.refresh_token,
      getRefreshTokenCookieOptions(),
    );

    return {
      message: response.message || RESPONSE_MESSAGES.AUTH.DASHBOARD_USER_LOGGED_IN,
      data: response.user,
    };
  }

  @Post(API_ROUTES.DASHBOARD_USER.AUTH.REFRESH_TOKEN)
  @UsePipes(ZodValidationPipe)
  async refreshToken(
    @Req() req: Request,
    @Body() body: DashboardUserRefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.[COOKIE_NAMES.DASHBOARD_REFRESH_TOKEN] || body?.refresh_token || '';
    if (!token) {
      throw new Error(RESPONSE_MESSAGES.AUTH.NO_REFRESH_TOKEN);
    }

    const response = await lastValueFrom(
      this._dashboardUserAuthClient.refreshToken({ refresh_token: token }),
    );

    res.cookie(COOKIE_NAMES.DASHBOARD_ACCESS_TOKEN, response.access_token, getAccessTokenCookieOptions());
    res.cookie(
      COOKIE_NAMES.DASHBOARD_REFRESH_TOKEN,
      response.refresh_token,
      getRefreshTokenCookieOptions(),
    );

    return {
      message: response.message,
      data: null,
    };
  }

  @Post(API_ROUTES.DASHBOARD_USER.AUTH.FORGOT_PASSWORD)
  @UsePipes(ZodValidationPipe)
  async forgotPassword(@Body() body: DashboardUserForgotPasswordDto) {
    const response = await lastValueFrom(this._dashboardUserAuthClient.forgotPassword(body));
    return {
      message: response.message,
      data: null,
    };
  }

  @Post(API_ROUTES.DASHBOARD_USER.AUTH.RESET_PASSWORD)
  @UsePipes(ZodValidationPipe)
  async resetPassword(@Body() body: DashboardUserResetPasswordDto) {
    const response = await lastValueFrom(
      this._dashboardUserAuthClient.resetPassword({
        token: body.token,
        new_password: body.new_password,
      }),
    );
    return {
      message: response.message,
      data: null,
    };
  }

  @Get(API_ROUTES.DASHBOARD_USER.AUTH.ME)
  @UseGuards(TenantAuthGuard)
  async getProfile(@Req() req: AuthenticatedTenantRequest) {
    const userId = req.dashboardUser?.user_id;
    if (!userId) {
      throw new Error(RESPONSE_MESSAGES.AUTH.USER_ID_NOT_FOUND);
    }

    const response = await lastValueFrom(
      this._dashboardUserAuthClient.getProfile({ user_id: userId }),
    );

    return {
      message: RESPONSE_MESSAGES.AUTH.PROFILE_RETRIEVED,
      data: response.user,
    };
  }
}

