import {
  Body,
  Controller,
  Get,
  Inject,
  OnModuleInit,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { SuperAdminAuthServiceClient } from '@repo/proto/superadmin';
import { Request, Response } from 'express';
import { ZodValidationPipe } from 'nestjs-zod';
import { lastValueFrom } from 'rxjs';
import { COOKIE_NAMES } from '../../constants/cookies.constant.js';
import { RESPONSE_MESSAGES } from '../../constants/messages.constant.js';
import { API_ROUTES } from '../../constants/routes.constant.js';
import {
  AuthenticatedSuperAdminRequest,
  SuperAdminAuthGuard,
} from '../../guards/superadmin-auth.guard.js';
import {
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
} from '../../utils/cookie.util.js';
import {
  SuperAdminLoginDto,
  SuperAdminLogoutDto,
  SuperAdminRefreshTokenDto,
} from './dtos/superAdmin.dto.js';

@Controller(API_ROUTES.SUPERADMIN.AUTH.BASE)
export class SuperAdminController implements OnModuleInit {
  private _superAdminAuthService!: SuperAdminAuthServiceClient;

  constructor(@Inject('SUPERADMIN_PACKAGE') private readonly _client: ClientGrpc) {}

  onModuleInit() {
    this._superAdminAuthService =
      this._client.getService<SuperAdminAuthServiceClient>('SuperAdminAuthService');
  }

  @Post(API_ROUTES.SUPERADMIN.AUTH.LOGIN)
  @UsePipes(ZodValidationPipe)
  async login(@Body() body: SuperAdminLoginDto, @Res({ passthrough: true }) res: Response) {
    const response = await lastValueFrom(this._superAdminAuthService.login(body));

    res.cookie(COOKIE_NAMES.SUPERADMIN_ACCESS_TOKEN, response.access_token, getAccessTokenCookieOptions());
    res.cookie(COOKIE_NAMES.SUPERADMIN_REFRESH_TOKEN, response.refresh_token, getRefreshTokenCookieOptions());

    return {
      message: response.message,
      data: response.superAdmin,
    };
  }

  @Post(API_ROUTES.SUPERADMIN.AUTH.REFRESH_TOKEN)
  @UsePipes(ZodValidationPipe)
  async refreshToken(
    @Req() req: Request,
    @Body() body: SuperAdminRefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.[COOKIE_NAMES.SUPERADMIN_REFRESH_TOKEN] || body?.refresh_token || '';
    const response = await lastValueFrom(
      this._superAdminAuthService.refreshToken({ refresh_token: token }),
    );

    res.cookie(COOKIE_NAMES.SUPERADMIN_ACCESS_TOKEN, response.access_token, getAccessTokenCookieOptions());
    res.cookie(COOKIE_NAMES.SUPERADMIN_REFRESH_TOKEN, response.refresh_token, getRefreshTokenCookieOptions());

    return {
      message: response.message,
      data: null,
    };
  }

  @Post(API_ROUTES.SUPERADMIN.AUTH.LOGOUT)
  @UsePipes(ZodValidationPipe)
  async logout(
    @Req() req: Request,
    @Body() body: SuperAdminLogoutDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.[COOKIE_NAMES.SUPERADMIN_REFRESH_TOKEN] || body?.refresh_token || '';
    const response = await lastValueFrom(
      this._superAdminAuthService.logout({ refresh_token: token }),
    );
    res.clearCookie(COOKIE_NAMES.SUPERADMIN_ACCESS_TOKEN);
    res.clearCookie(COOKIE_NAMES.SUPERADMIN_REFRESH_TOKEN);
    return {
      message: response.message || RESPONSE_MESSAGES.AUTH.LOGGED_OUT,
      data: null,
    };
  }

  @Get(API_ROUTES.SUPERADMIN.AUTH.ME)
  @UseGuards(SuperAdminAuthGuard)
  async me(@Req() req: AuthenticatedSuperAdminRequest) {
    const superAdminId = req.superAdmin?.super_admin_id;
    if (!superAdminId) {
      throw new UnauthorizedException(RESPONSE_MESSAGES.AUTH.UNAUTHORIZED);
    }

    const response = await lastValueFrom(
      this._superAdminAuthService.getProfile({ superadmin_id: superAdminId }),
    );
    return {
      message: RESPONSE_MESSAGES.AUTH.PROFILE_RETRIEVED,
      data: response.superAdmin,
    };
  }
}

