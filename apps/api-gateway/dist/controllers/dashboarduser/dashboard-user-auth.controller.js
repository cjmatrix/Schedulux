"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardUserAuthController = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const nestjs_zod_1 = require("nestjs-zod");
const dashboard_user_dto_js_1 = require("./dtos/dashboard-user.dto.js");
const tenant_auth_guard_js_1 = require("../../guards/tenant-auth.guard.js");
let DashboardUserAuthController = class DashboardUserAuthController {
    client;
    dashboardUserAuthClient;
    constructor(client) {
        this.client = client;
    }
    onModuleInit() {
        this.dashboardUserAuthClient = this.client.getService("DashboardAuthService");
    }
    async Login(data, res) {
        const response = await (0, rxjs_1.lastValueFrom)(this.dashboardUserAuthClient.login(data));
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
    async refreshToken(req, body, res) {
        const token = req.cookies?.dashboarduser_refresh_token || body?.refresh_token || "";
        if (!token) {
            throw new Error("No refresh token provided");
        }
        const response = await (0, rxjs_1.lastValueFrom)(this.dashboardUserAuthClient.refreshToken({ refresh_token: token }));
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
            message: response.message,
            data: null,
        };
    }
    async forgotPassword(body) {
        const response = await (0, rxjs_1.lastValueFrom)(this.dashboardUserAuthClient.forgotPassword(body));
        return {
            message: response.message,
            data: null,
        };
    }
    async resetPassword(body) {
        const response = await (0, rxjs_1.lastValueFrom)(this.dashboardUserAuthClient.resetPassword({
            token: body.token,
            new_password: body.new_password
        }));
        return {
            message: response.message,
            data: null,
        };
    }
    async getProfile(req) {
        const userId = req.dashboardUser?.user_id;
        if (!userId) {
            throw new Error("User ID not found in request");
        }
        const response = await (0, rxjs_1.lastValueFrom)(this.dashboardUserAuthClient.getProfile({ user_id: userId }));
        return {
            message: "Profile retrieved successfully",
            data: response.user,
        };
    }
};
exports.DashboardUserAuthController = DashboardUserAuthController;
__decorate([
    (0, common_1.Post)("login"),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dashboard_user_dto_js_1.DashboardUserLoginDto, Object]),
    __metadata("design:returntype", Promise)
], DashboardUserAuthController.prototype, "Login", null);
__decorate([
    (0, common_1.Post)("refresh-token"),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dashboard_user_dto_js_1.DashboardUserRefreshTokenDto, Object]),
    __metadata("design:returntype", Promise)
], DashboardUserAuthController.prototype, "refreshToken", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dashboard_user_dto_js_1.DashboardUserForgotPasswordDto]),
    __metadata("design:returntype", Promise)
], DashboardUserAuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dashboard_user_dto_js_1.DashboardUserResetPasswordDto]),
    __metadata("design:returntype", Promise)
], DashboardUserAuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Get)("me"),
    (0, common_1.UseGuards)(tenant_auth_guard_js_1.TenantAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardUserAuthController.prototype, "getProfile", null);
exports.DashboardUserAuthController = DashboardUserAuthController = __decorate([
    (0, common_1.Controller)("api/v1/dashboard-user/auth"),
    __param(0, (0, common_1.Inject)("DASHBOARD_PACKAGE")),
    __metadata("design:paramtypes", [Object])
], DashboardUserAuthController);
