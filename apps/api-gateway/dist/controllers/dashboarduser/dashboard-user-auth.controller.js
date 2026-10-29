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
const nestjs_zod_1 = require("nestjs-zod");
const rxjs_1 = require("rxjs");
const cookies_constant_js_1 = require("../../constants/cookies.constant.js");
const messages_constant_js_1 = require("../../constants/messages.constant.js");
const routes_constant_js_1 = require("../../constants/routes.constant.js");
const tenant_auth_guard_js_1 = require("../../guards/tenant-auth.guard.js");
const cookie_util_js_1 = require("../../utils/cookie.util.js");
const dashboard_user_dto_js_1 = require("./dtos/dashboard-user.dto.js");
let DashboardUserAuthController = class DashboardUserAuthController {
    _client;
    _dashboardUserAuthClient;
    constructor(_client) {
        this._client = _client;
    }
    onModuleInit() {
        this._dashboardUserAuthClient = this._client.getService('DashboardAuthService');
    }
    async Login(data, res) {
        const response = await (0, rxjs_1.lastValueFrom)(this._dashboardUserAuthClient.login(data));
        res.cookie(cookies_constant_js_1.COOKIE_NAMES.DASHBOARD_ACCESS_TOKEN, response.access_token, (0, cookie_util_js_1.getAccessTokenCookieOptions)());
        res.cookie(cookies_constant_js_1.COOKIE_NAMES.DASHBOARD_REFRESH_TOKEN, response.refresh_token, (0, cookie_util_js_1.getRefreshTokenCookieOptions)());
        return {
            message: response.message || messages_constant_js_1.RESPONSE_MESSAGES.AUTH.DASHBOARD_USER_LOGGED_IN,
            data: response.user,
        };
    }
    async refreshToken(req, body, res) {
        const token = req.cookies?.[cookies_constant_js_1.COOKIE_NAMES.DASHBOARD_REFRESH_TOKEN] || body?.refresh_token || '';
        if (!token) {
            throw new Error(messages_constant_js_1.RESPONSE_MESSAGES.AUTH.NO_REFRESH_TOKEN);
        }
        const response = await (0, rxjs_1.lastValueFrom)(this._dashboardUserAuthClient.refreshToken({ refresh_token: token }));
        res.cookie(cookies_constant_js_1.COOKIE_NAMES.DASHBOARD_ACCESS_TOKEN, response.access_token, (0, cookie_util_js_1.getAccessTokenCookieOptions)());
        res.cookie(cookies_constant_js_1.COOKIE_NAMES.DASHBOARD_REFRESH_TOKEN, response.refresh_token, (0, cookie_util_js_1.getRefreshTokenCookieOptions)());
        return {
            message: response.message,
            data: null,
        };
    }
    async forgotPassword(body) {
        const response = await (0, rxjs_1.lastValueFrom)(this._dashboardUserAuthClient.forgotPassword(body));
        return {
            message: response.message,
            data: null,
        };
    }
    async resetPassword(body) {
        const response = await (0, rxjs_1.lastValueFrom)(this._dashboardUserAuthClient.resetPassword({
            token: body.token,
            new_password: body.new_password,
        }));
        return {
            message: response.message,
            data: null,
        };
    }
    async getProfile(req) {
        const userId = req.dashboardUser?.user_id;
        if (!userId) {
            throw new Error(messages_constant_js_1.RESPONSE_MESSAGES.AUTH.USER_ID_NOT_FOUND);
        }
        const response = await (0, rxjs_1.lastValueFrom)(this._dashboardUserAuthClient.getProfile({ user_id: userId }));
        return {
            message: messages_constant_js_1.RESPONSE_MESSAGES.AUTH.PROFILE_RETRIEVED,
            data: response.user,
        };
    }
};
exports.DashboardUserAuthController = DashboardUserAuthController;
__decorate([
    (0, common_1.Post)(routes_constant_js_1.API_ROUTES.DASHBOARD_USER.AUTH.LOGIN),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dashboard_user_dto_js_1.DashboardUserLoginDto, Object]),
    __metadata("design:returntype", Promise)
], DashboardUserAuthController.prototype, "Login", null);
__decorate([
    (0, common_1.Post)(routes_constant_js_1.API_ROUTES.DASHBOARD_USER.AUTH.REFRESH_TOKEN),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dashboard_user_dto_js_1.DashboardUserRefreshTokenDto, Object]),
    __metadata("design:returntype", Promise)
], DashboardUserAuthController.prototype, "refreshToken", null);
__decorate([
    (0, common_1.Post)(routes_constant_js_1.API_ROUTES.DASHBOARD_USER.AUTH.FORGOT_PASSWORD),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dashboard_user_dto_js_1.DashboardUserForgotPasswordDto]),
    __metadata("design:returntype", Promise)
], DashboardUserAuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)(routes_constant_js_1.API_ROUTES.DASHBOARD_USER.AUTH.RESET_PASSWORD),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dashboard_user_dto_js_1.DashboardUserResetPasswordDto]),
    __metadata("design:returntype", Promise)
], DashboardUserAuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Get)(routes_constant_js_1.API_ROUTES.DASHBOARD_USER.AUTH.ME),
    (0, common_1.UseGuards)(tenant_auth_guard_js_1.TenantAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardUserAuthController.prototype, "getProfile", null);
exports.DashboardUserAuthController = DashboardUserAuthController = __decorate([
    (0, common_1.Controller)(routes_constant_js_1.API_ROUTES.DASHBOARD_USER.AUTH.BASE),
    __param(0, (0, common_1.Inject)('DASHBOARD_PACKAGE')),
    __metadata("design:paramtypes", [Object])
], DashboardUserAuthController);
