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
const rxjs_1 = require("rxjs");
const nestjs_zod_1 = require("nestjs-zod");
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
        this.dashboardUserServiceClient = this.dashboardClient.getService('DashboardUserService');
    }
    async register(body, res) {
        try {
            const response = await (0, rxjs_1.lastValueFrom)(this.tenantAuthService.register(body));
            return res.status(201).json(response);
        }
        catch (err) {
            if (err.code === 6)
                return res.status(409).json({ error: err.details });
            if (err.code === 3)
                return res.status(400).json({ error: err.details });
            return res.status(500).json({ error: err.details || 'Internal server error' });
        }
    }
    async login(body, res) {
        try {
            const response = await (0, rxjs_1.lastValueFrom)(this.tenantAuthService.login(body));
            const isProduction = process.env.NODE_ENV === 'production';
            res.cookie('access_token', response.access_token, {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? 'none' : 'lax',
                maxAge: 15 * 60 * 1000,
            });
            res.cookie('refresh_token', response.refresh_token, {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? 'none' : 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            return res.status(200).json({
                message: response.message,
                tenant: response.tenant,
            });
        }
        catch (err) {
            if (err.code === 16)
                return res.status(401).json({ error: err.details });
            if (err.code === 7)
                return res.status(403).json({ error: err.details });
            if (err.code === 3)
                return res.status(400).json({ error: err.details });
            return res.status(500).json({ error: err.details || 'Internal server error' });
        }
    }
    async verifyEmail(token, res) {
        try {
            const response = await (0, rxjs_1.lastValueFrom)(this.tenantAuthService.verifyEmail({ token }));
            return res.status(200).json(response);
        }
        catch (err) {
            if (err.code === 3)
                return res.status(400).json({ error: err.details });
            return res.status(500).json({ error: err.details || 'Internal server error' });
        }
    }
    async refreshToken(req, res) {
        try {
            const token = req.cookies?.refresh_token || req.body?.refresh_token;
            const response = await (0, rxjs_1.lastValueFrom)(this.tenantAuthService.refreshToken({ refresh_token: token }));
            const isProduction = process.env.NODE_ENV === 'production';
            res.cookie('access_token', response.access_token, {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? 'none' : 'lax',
                maxAge: 15 * 60 * 1000,
            });
            res.cookie('refresh_token', response.refresh_token, {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? 'none' : 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            return res.status(200).json({ message: response.message });
        }
        catch (err) {
            res.clearCookie('access_token');
            res.clearCookie('refresh_token');
            if (err.code === 16)
                return res.status(401).json({ error: err.details });
            if (err.code === 3)
                return res.status(400).json({ error: err.details });
            return res.status(500).json({ error: err.details || 'Internal server error' });
        }
    }
    async logout(req, res) {
        try {
            const token = req.cookies?.refresh_token || req.body?.refresh_token;
            const response = await (0, rxjs_1.lastValueFrom)(this.tenantAuthService.logout({ refresh_token: token }));
            res.clearCookie('access_token');
            res.clearCookie('refresh_token');
            return res.status(200).json(response);
        }
        catch (err) {
            res.clearCookie('access_token');
            res.clearCookie('refresh_token');
            return res.status(500).json({ error: err.details || 'Internal server error' });
        }
    }
    async inviteUser(body, res) {
        try {
            const response = await (0, rxjs_1.lastValueFrom)(this.dashboardUserServiceClient.inviteUser(body));
            return res.status(201).json(response);
        }
        catch (err) {
            if (err.code === 6)
                return res.status(409).json({ error: err.details });
            if (err.code === 5)
                return res.status(404).json({ error: err.details });
            if (err.code === 3)
                return res.status(400).json({ error: err.details });
            return res.status(500).json({ error: err.details || 'Internal server error' });
        }
    }
    async listWorkspaceUsers(tenant_id, page, limit, search, role, res) {
        try {
            const response = await (0, rxjs_1.lastValueFrom)(this.dashboardUserServiceClient.listWorkspaceUsers({
                tenant_id: tenant_id || '',
                page: page ? parseInt(page, 10) : undefined,
                limit: limit ? parseInt(limit, 10) : undefined,
                search: search || undefined,
                role: role || undefined,
            }));
            return res.status(200).json(response);
        }
        catch (err) {
            return res.status(500).json({ error: err.details || 'Internal server error' });
        }
    }
};
exports.TenantController = TenantController;
__decorate([
    (0, common_1.Post)('register'),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [tenant_dto_js_1.TenantRegisterDto, Object]),
    __metadata("design:returntype", Promise)
], TenantController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [tenant_dto_js_1.TenantLoginDto, Object]),
    __metadata("design:returntype", Promise)
], TenantController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('verify-email'),
    __param(0, (0, common_1.Query)('token')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TenantController.prototype, "verifyEmail", null);
__decorate([
    (0, common_1.Post)('refresh-token'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TenantController.prototype, "refreshToken", null);
__decorate([
    (0, common_1.Post)('logout'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TenantController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)('invite-user'),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [tenant_dto_js_1.InviteUserDto, Object]),
    __metadata("design:returntype", Promise)
], TenantController.prototype, "inviteUser", null);
__decorate([
    (0, common_1.Get)('workspace-users'),
    __param(0, (0, common_1.Query)('tenant_id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('search')),
    __param(4, (0, common_1.Query)('role')),
    __param(5, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], TenantController.prototype, "listWorkspaceUsers", null);
exports.TenantController = TenantController = __decorate([
    (0, common_1.Controller)('api/v1/tenant/auth'),
    __param(0, (0, common_1.Inject)('TENANT_PACKAGE')),
    __param(1, (0, common_1.Inject)('DASHBOARD_PACKAGE')),
    __metadata("design:paramtypes", [Object, Object])
], TenantController);
