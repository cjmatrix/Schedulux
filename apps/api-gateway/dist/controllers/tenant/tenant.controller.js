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
exports.TenantController = void 0;
const common_1 = require("@nestjs/common");
const nestjs_zod_1 = require("nestjs-zod");
const rxjs_1 = require("rxjs");
const tenant_auth_guard_js_1 = require("../../guards/tenant-auth.guard.js");
const cookie_util_js_1 = require("../../utils/cookie.util.js");
const tenant_dto_js_1 = require("./dtos/tenant.dto.js");
let TenantController = class TenantController {
    client;
    dashboardClient;
    tenantAuthService;
    tenantServiceClient;
    dashboardUserServiceClient;
    constructor(client, dashboardClient) {
        this.client = client;
        this.dashboardClient = dashboardClient;
    }
    onModuleInit() {
        this.tenantAuthService = this.client.getService('TenantAuthService');
        this.tenantServiceClient = this.client.getService('TenantService');
        this.dashboardUserServiceClient =
            this.dashboardClient.getService('DashboardUserService');
    }
    async getProfile(req) {
        const tenantId = req.tenant?.tenant_id || '';
        const response = await (0, rxjs_1.lastValueFrom)(this.tenantAuthService.getProfile({ tenant_id: tenantId }));
        return {
            message: 'Profile retrieved successfully',
            data: response.tenant,
        };
    }
    async register(body) {
        const response = await (0, rxjs_1.lastValueFrom)(this.tenantAuthService.register(body));
        return {
            message: response.message,
            data: {
                tenant_id: response.tenant_id,
                verification_token: response.verification_token,
            },
        };
    }
    async login(body, res) {
        const response = await (0, rxjs_1.lastValueFrom)(this.tenantAuthService.login(body));
        res.cookie('access_token', response.access_token, (0, cookie_util_js_1.getAccessTokenCookieOptions)());
        res.cookie('refresh_token', response.refresh_token, (0, cookie_util_js_1.getRefreshTokenCookieOptions)());
        return {
            message: response.message,
            data: response.tenant,
        };
    }
    async googleLogin(body, res) {
        const response = await (0, rxjs_1.lastValueFrom)(this.tenantAuthService.googleLogin({ id_token: body.id_token }));
        res.cookie('access_token', response.access_token, (0, cookie_util_js_1.getAccessTokenCookieOptions)());
        res.cookie('refresh_token', response.refresh_token, (0, cookie_util_js_1.getRefreshTokenCookieOptions)());
        return {
            message: response.message,
            data: response.tenant,
        };
    }
    async verifyEmail(query) {
        const response = await (0, rxjs_1.lastValueFrom)(this.tenantAuthService.verifyEmail({ token: query.token }));
        return {
            message: response.message,
            data: { tenant_id: response.tenant_id },
        };
    }
    async refreshToken(req, body, res) {
        const token = req.cookies?.refresh_token || body?.refresh_token || '';
        const response = await (0, rxjs_1.lastValueFrom)(this.tenantAuthService.refreshToken({ refresh_token: token }));
        res.cookie('access_token', response.access_token, (0, cookie_util_js_1.getAccessTokenCookieOptions)());
        res.cookie('refresh_token', response.refresh_token, (0, cookie_util_js_1.getRefreshTokenCookieOptions)());
        return {
            message: response.message,
            data: null,
        };
    }
    async logout(req, body, res) {
        const token = req.cookies?.refresh_token || body?.refresh_token || '';
        if (token) {
            await (0, rxjs_1.lastValueFrom)(this.tenantAuthService.logout({ refresh_token: token })).catch(() => { });
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
    async forgotPassword(body) {
        const response = await (0, rxjs_1.lastValueFrom)(this.tenantAuthService.forgotPassword(body));
        return {
            message: response.message,
            data: null,
        };
    }
    async resetPassword(body) {
        const response = await (0, rxjs_1.lastValueFrom)(this.tenantAuthService.resetPassword({
            token: body.token,
            new_password: body.new_password,
        }));
        return {
            message: response.message,
            data: null,
        };
    }
    async inviteUser(body) {
        const response = await (0, rxjs_1.lastValueFrom)(this.dashboardUserServiceClient.inviteUser(body));
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
    async listWorkspaceUsers(query) {
        const response = await (0, rxjs_1.lastValueFrom)(this.dashboardUserServiceClient.listWorkspaceUsers({
            tenant_id: query.tenant_id,
            page: query.page,
            limit: query.limit,
            search: query.search,
            role: query.role,
        }));
        return {
            message: 'Workspace users retrieved successfully',
            data: response,
        };
    }
};
exports.TenantController = TenantController;
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(tenant_auth_guard_js_1.TenantAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TenantController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Post)('register'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [tenant_dto_js_1.TenantRegisterDto]),
    __metadata("design:returntype", Promise)
], TenantController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [tenant_dto_js_1.TenantLoginDto, Object]),
    __metadata("design:returntype", Promise)
], TenantController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('google'),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [tenant_dto_js_1.TenantGoogleLoginDto, Object]),
    __metadata("design:returntype", Promise)
], TenantController.prototype, "googleLogin", null);
__decorate([
    (0, common_1.Get)('verify-email'),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [tenant_dto_js_1.VerifyEmailDto]),
    __metadata("design:returntype", Promise)
], TenantController.prototype, "verifyEmail", null);
__decorate([
    (0, common_1.Post)('refresh-token'),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, tenant_dto_js_1.RefreshTokenDto, Object]),
    __metadata("design:returntype", Promise)
], TenantController.prototype, "refreshToken", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, tenant_dto_js_1.LogoutDto, Object]),
    __metadata("design:returntype", Promise)
], TenantController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [tenant_dto_js_1.ForgotPasswordDto]),
    __metadata("design:returntype", Promise)
], TenantController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [tenant_dto_js_1.ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], TenantController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Post)('invite-user'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [tenant_dto_js_1.InviteUserDto]),
    __metadata("design:returntype", Promise)
], TenantController.prototype, "inviteUser", null);
__decorate([
    (0, common_1.Get)('workspace-users'),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [tenant_dto_js_1.ListWorkspaceUsersDto]),
    __metadata("design:returntype", Promise)
], TenantController.prototype, "listWorkspaceUsers", null);
exports.TenantController = TenantController = __decorate([
    (0, common_1.Controller)('api/v1/tenant/auth'),
    __param(0, (0, common_1.Inject)('TENANT_PACKAGE')),
    __param(1, (0, common_1.Inject)('DASHBOARD_PACKAGE')),
    __metadata("design:paramtypes", [Object, Object])
], TenantController);
