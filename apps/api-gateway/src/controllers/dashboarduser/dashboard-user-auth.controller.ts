import {
  Body,
  Controller,
  Inject,
  OnModuleInit,
  Post,
  Res,
  UsePipes,
} from "@nestjs/common";
import { ClientGrpc } from "@nestjs/microservices";
import { DashboardAuthServiceClient } from "@repo/proto/dashboard";
import { lastValueFrom } from "rxjs";
import { Response } from "express";
import { ZodValidationPipe } from "nestjs-zod";
import { DashboardUserLoginDto } from "./dtos/dashboard-user.dto.js";

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
    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("dashboarduser_access_token", response.access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("dashboarduser_refresh_token", response.refresh_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      message: response.message || "Dashboard user logged in successfully",
      data: response.user,
    };
  }
}
