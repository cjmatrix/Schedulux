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
const superAdmin_dto_js_1 = require("./dtos/superAdmin.dto.js");
let SuperAdminController = class SuperAdminController {
    client;
    superAdminAuthService;
    constructor(client) {
        this.client = client;
    }
    onModuleInit() {
        this.superAdminAuthService = this.client.getService('SuperAdminAuthService');
    }
    async login(body, res) {
        try {
            const response = await (0, rxjs_1.lastValueFrom)(this.superAdminAuthService.Login(body));
            const isProduction = process.env.NODE_ENV === 'production';
            res.cookie('superadmin_access_token', response.access_token, {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? 'none' : 'lax',
                maxAge: 15 * 60 * 1000,
            });
            res.cookie('superadmin_refresh_token', response.refresh_token, {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? 'none' : 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            return res.status(200).json({
                message: response.message,
                superAdmin: response.superAdmin,
            });
        }
        catch (err) {
            if (err.code === 16)
                return res.status(401).json({ error: err.details });
            if (err.code === 3)
                return res.status(400).json({ error: err.details });
            return res.status(500).json({ error: err.details || 'Internal server error' });
        }
    }
    async refreshToken(req, res) {
        try {
            const token = req.cookies?.superadmin_refresh_token || req.body?.refresh_token;
            const response = await (0, rxjs_1.lastValueFrom)(this.superAdminAuthService.RefreshToken({ refresh_token: token }));
            const isProduction = process.env.NODE_ENV === 'production';
            res.cookie('superadmin_access_token', response.access_token, {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? 'none' : 'lax',
                maxAge: 15 * 60 * 1000,
            });
            res.cookie('superadmin_refresh_token', response.refresh_token, {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? 'none' : 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            return res.status(200).json({ message: response.message });
        }
        catch (err) {
            res.clearCookie('superadmin_access_token');
            res.clearCookie('superadmin_refresh_token');
            if (err.code === 16)
                return res.status(401).json({ error: err.details });
            if (err.code === 3)
                return res.status(400).json({ error: err.details });
            return res.status(500).json({ error: err.details || 'Internal server error' });
        }
    }
    async logout(req, res) {
        try {
            const token = req.cookies?.superadmin_refresh_token || req.body?.refresh_token;
            const response = await (0, rxjs_1.lastValueFrom)(this.superAdminAuthService.Logout({ refresh_token: token }));
            res.clearCookie('superadmin_access_token');
            res.clearCookie('superadmin_refresh_token');
            return res.status(200).json(response);
        }
        catch (err) {
            res.clearCookie('superadmin_access_token');
            res.clearCookie('superadmin_refresh_token');
            return res.status(500).json({ error: err.details || 'Internal server error' });
        }
    }
    async me(req, res) {
        try {
            const superAdminId = req.superAdmin?.super_admin_id;
            if (!superAdminId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const response = await (0, rxjs_1.lastValueFrom)(this.superAdminAuthService.GetProfile({ superadmin_id: superAdminId }));
            return res.status(200).json(response);
        }
        catch (err) {
            if (err.code === 16)
                return res.status(401).json({ error: err.details });
            if (err.code === 5)
                return res.status(404).json({ error: err.details });
            return res.status(500).json({ error: err.details || 'Internal server error' });
        }
    }
};
exports.SuperAdminController = SuperAdminController;
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [superAdmin_dto_js_1.SuperAdminLoginDto, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('refresh-token'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "refreshToken", null);
__decorate([
    (0, common_1.Post)('logout'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "me", null);
exports.SuperAdminController = SuperAdminController = __decorate([
    (0, common_1.Controller)('api/v1/superadmin/auth'),
    __param(0, (0, common_1.Inject)('SUPERADMIN_PACKAGE')),
    __metadata("design:paramtypes", [Object])
], SuperAdminController);
