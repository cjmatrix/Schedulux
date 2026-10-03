import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  Inject,
  OnModuleInit,
  UsePipes,
  UseGuards,
  UnauthorizedException,
} from "@nestjs/common";
import { ClientGrpc } from "@nestjs/microservices";
import { Request, Response } from "express";
import { Observable, lastValueFrom } from "rxjs";
import { ZodValidationPipe } from "nestjs-zod";
import {
  SuperAdminAuthGuard,
  AuthenticatedSuperAdminRequest,
} from "../../guards/superadmin-auth.guard.js";
import {
  SuperAdminLoginDto,
  SuperAdminRefreshTokenDto,
  SuperAdminLogoutDto,
} from "./dtos/superAdmin.dto.js";
import { SuperAdminAuthServiceClient } from "@repo/proto/superadmin";

@Controller("api/v1/superadmin/auth")
export class SuperAdminController implements OnModuleInit {
  private superAdminAuthService!: SuperAdminAuthServiceClient;

  constructor(@Inject("SUPERADMIN_PACKAGE") private client: ClientGrpc) {}

  onModuleInit() {
    this.superAdminAuthService = this.client.getService<SuperAdminAuthServiceClient>(
      "SuperAdminAuthService",
    );
  }

  @Post("login")
  @UsePipes(ZodValidationPipe)
  async login(
    @Body() body: SuperAdminLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const response = await lastValueFrom(
      this.superAdminAuthService.login(body),
    );
    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("superadmin_access_token", response.access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("superadmin_refresh_token", response.refresh_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      message: response.message,
      data: response.superAdmin,
    };
  }

  @Post("refresh-token")
  @UsePipes(ZodValidationPipe)
  async refreshToken(
    @Req() req: Request,
    @Body() body: SuperAdminRefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token =
      req.cookies?.superadmin_refresh_token || body?.refresh_token || "";
    const response = await lastValueFrom(
      this.superAdminAuthService.refreshToken({ refresh_token: token }),
    );
    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("superadmin_access_token", response.access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("superadmin_refresh_token", response.refresh_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      message: response.message,
      data: null,
    };
  }

  @Post("logout")
  @UsePipes(ZodValidationPipe)
  async logout(
    @Req() req: Request,
    @Body() body: SuperAdminLogoutDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token =
      req.cookies?.superadmin_refresh_token || body?.refresh_token || "";
    const response = await lastValueFrom(
      this.superAdminAuthService.logout({ refresh_token: token }),
    );
    res.clearCookie("superadmin_access_token");
    res.clearCookie("superadmin_refresh_token");
    return {
      message: response.message || "Logged out successfully",
      data: null,
    };
  }

  @Get("me")
  @UseGuards(SuperAdminAuthGuard)
  async me(@Req() req: AuthenticatedSuperAdminRequest) {
    const superAdminId = req.superAdmin?.super_admin_id;
    if (!superAdminId) {
      throw new UnauthorizedException("Unauthorized");
    }

    const response = await lastValueFrom(
      this.superAdminAuthService.getProfile({ superadmin_id: superAdminId }),
    );
    return {
      message: "Profile retrieved successfully",
      data: response.superAdmin,
    };
  }
}
