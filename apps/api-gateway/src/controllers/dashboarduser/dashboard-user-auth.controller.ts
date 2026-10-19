import {
  Body,
  Controller,
  Inject,
  OnModuleInit,
  Post,
  Get,
  Req,
  Res,
  UsePipes,
  UseGuards,
} from "@nestjs/common";
import { ClientGrpc } from "@nestjs/microservices";
import { DashboardAuthServiceClient } from "@repo/proto/dashboard";
import { lastValueFrom } from "rxjs";
import { Request, Response } from "express";
import { ZodValidationPipe } from "nestjs-zod";
import { DashboardUserLoginDto, DashboardUserRefreshTokenDto, DashboardUserForgotPasswordDto, DashboardUserResetPasswordDto } from "./dtos/dashboard-user.dto.js";
import { TenantAuthGuard, AuthenticatedTenantRequest } from "../../guards/tenant-auth.guard.js";
import { getAccessTokenCookieOptions, getRefreshTokenCookieOptions } from "../../utils/cookie.util.js";

@Controller("api/v1/dashboard-user/auth")
export class DashboardUserAuthController implements OnModuleInit {
  private dashboardUserAuthClient!: DashboardAuthServiceClient;

  constructor(@Inject("DASHBOARD_PACKAGE") private client: ClientGrpc) {}

  onModuleInit() {
    this.dashboardUserAuthClient = this.client.getService(
      "DashboardAuthService",
    );
  }

  @Post("login")
  @UsePipes(ZodValidationPipe)
  async Login(
    @Body() data: DashboardUserLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const response = await lastValueFrom(
      this.dashboardUserAuthClient.login(data),
    );

    res.cookie("dashboarduser_access_token", response.access_token, getAccessTokenCookieOptions());
    res.cookie("dashboarduser_refresh_token", response.refresh_token, getRefreshTokenCookieOptions());

    return {
      message: response.message || "Dashboard user logged in successfully",
      data: response.user,
    };
  }

  @Post("refresh-token")
  @UsePipes(ZodValidationPipe)
  async refreshToken(
    @Req() req: Request,
    @Body() body: DashboardUserRefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.dashboarduser_refresh_token || body?.refresh_token || "";
    if (!token) {
      throw new Error("No refresh token provided");
    }

    const response = await lastValueFrom(
      this.dashboardUserAuthClient.refreshToken({ refresh_token: token }),
    );

    res.cookie("dashboarduser_access_token", response.access_token, getAccessTokenCookieOptions());
    res.cookie("dashboarduser_refresh_token", response.refresh_token, getRefreshTokenCookieOptions());

    return {
      message: response.message,
      data: null,
    };
  }

  @Post('forgot-password')
  @UsePipes(ZodValidationPipe)
  async forgotPassword(@Body() body: DashboardUserForgotPasswordDto) {
    const response = await lastValueFrom(this.dashboardUserAuthClient.forgotPassword(body));
    return {
      message: response.message,
      data: null,
    };
  }

  @Post('reset-password')
  @UsePipes(ZodValidationPipe)
  async resetPassword(@Body() body: DashboardUserResetPasswordDto) {
    const response = await lastValueFrom(this.dashboardUserAuthClient.resetPassword({
      token: body.token,
      new_password: body.new_password
    }));
    return {
      message: response.message,
      data: null,
    };
  }

  @Get("me")
  @UseGuards(TenantAuthGuard)
  async getProfile(@Req() req: AuthenticatedTenantRequest) {
    
    const userId = req.dashboardUser?.user_id;
    if (!userId) {
      throw new Error("User ID not found in request");
    }

    const response = await lastValueFrom(
      this.dashboardUserAuthClient.getProfile({ user_id: userId })
    );

    return {
      message: "Profile retrieved successfully",
      data: response.user,
    };
  }
}
