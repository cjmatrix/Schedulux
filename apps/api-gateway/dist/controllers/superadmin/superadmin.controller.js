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
exports.SuperAdminController = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const nestjs_zod_1 = require("nestjs-zod");
const superadmin_auth_guard_js_1 = require("../../guards/superadmin-auth.guard.js");
const superAdmin_dto_js_1 = require("./dtos/superAdmin.dto.js");
const cookie_util_js_1 = require("../../utils/cookie.util.js");
let SuperAdminController = class SuperAdminController {
    client;
    superAdminAuthService;
    constructor(client) {
        this.client = client;
    }
    onModuleInit() {
        this.superAdminAuthService = this.client.getService("SuperAdminAuthService");
    }
    async login(body, res) {
        const response = await (0, rxjs_1.lastValueFrom)(this.superAdminAuthService.login(body));
        const isProduction = process.env.NODE_ENV === "production";
        res.cookie("superadmin_access_token", response.access_token, (0, cookie_util_js_1.getAccessTokenCookieOptions)());
        res.cookie("superadmin_refresh_token", response.refresh_token, (0, cookie_util_js_1.getRefreshTokenCookieOptions)());
        return {
            message: response.message,
            data: response.superAdmin,
        };
    }
    async refreshToken(req, body, res) {
        const token = req.cookies?.superadmin_refresh_token || body?.refresh_token || "";
        const response = await (0, rxjs_1.lastValueFrom)(this.superAdminAuthService.refreshToken({ refresh_token: token }));
        res.cookie("superadmin_access_token", response.access_token, (0, cookie_util_js_1.getAccessTokenCookieOptions)());
        res.cookie("superadmin_refresh_token", response.refresh_token, (0, cookie_util_js_1.getRefreshTokenCookieOptions)());
        return {
            message: response.message,
            data: null,
        };
    }
    async logout(req, body, res) {
        const token = req.cookies?.superadmin_refresh_token || body?.refresh_token || "";
        const response = await (0, rxjs_1.lastValueFrom)(this.superAdminAuthService.logout({ refresh_token: token }));
        res.clearCookie("superadmin_access_token");
        res.clearCookie("superadmin_refresh_token");
        return {
            message: response.message || "Logged out successfully",
            data: null,
        };
    }
    async me(req) {
        const superAdminId = req.superAdmin?.super_admin_id;
        if (!superAdminId) {
            throw new common_1.UnauthorizedException("Unauthorized");
        }
        const response = await (0, rxjs_1.lastValueFrom)(this.superAdminAuthService.getProfile({ superadmin_id: superAdminId }));
        return {
            message: "Profile retrieved successfully",
            data: response.superAdmin,
        };
    }
};
exports.SuperAdminController = SuperAdminController;
__decorate([
    (0, common_1.Post)("login"),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [superAdmin_dto_js_1.SuperAdminLoginDto, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "login", null);
__decorate([
    (0, common_1.Post)("refresh-token"),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, superAdmin_dto_js_1.SuperAdminRefreshTokenDto, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "refreshToken", null);
__decorate([
    (0, common_1.Post)("logout"),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, superAdmin_dto_js_1.SuperAdminLogoutDto, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)("me"),
    (0, common_1.UseGuards)(superadmin_auth_guard_js_1.SuperAdminAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "me", null);
exports.SuperAdminController = SuperAdminController = __decorate([
    (0, common_1.Controller)("api/v1/superadmin/auth"),
    __param(0, (0, common_1.Inject)("SUPERADMIN_PACKAGE")),
    __metadata("design:paramtypes", [Object])
], SuperAdminController);
