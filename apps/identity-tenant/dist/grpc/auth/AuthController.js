var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
// auth.controller.ts
import { Controller, UseFilters } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { TenantService } from '../../services/tenantService.js';
import { SuperAdminService } from '../../services/superAdminService.js';
import { AllExceptionsFilter } from './rpcExpetionFilter.js';
let AuthController = class AuthController {
    tenantService;
    superAdminService;
    constructor(tenantService, superAdminService) {
        this.tenantService = tenantService;
        this.superAdminService = superAdminService;
    }
    async register(data) {
        const { business_name, full_name, email, password } = data;
        if (!business_name || !full_name || !email || !password) {
            throw new Error('Missing required fields');
        }
        return await this.tenantService.register({ business_name, full_name, email, password });
    }
    async verifyEmail(data) {
        const { token } = data;
        if (!token)
            throw new Error('Verification token is required');
        return await this.tenantService.verifyEmail(token);
    }
    async login(data) {
        const { email, password } = data;
        if (!email || !password)
            throw new Error('Email and password are required');
        const result = await this.tenantService.login(email, password);
        return {
            message: 'Login successful',
            tenant: {
                tenant_id: result.tenant.tenant_id,
                business_name: result.tenant.business_name,
                contact_email: result.tenant.contact_email,
                tier: result.tenant.tier,
                status: result.tenant.status,
            },
            access_token: result.accessToken,
            refresh_token: result.refreshToken,
        };
    }
    async refreshToken(data) {
        const { refresh_token } = data;
        if (!refresh_token)
            throw new Error('Refresh token is required');
        const result = await this.tenantService.refreshToken(refresh_token);
        return {
            message: 'Token rotated successfully',
            access_token: result.accessToken,
            refresh_token: result.refreshToken,
        };
    }
    async logout(data) {
        const { refresh_token } = data;
        await this.tenantService.logout(refresh_token);
        return { message: 'Logged out successfully' };
    }
    async superAdminLogin(data) {
        const { email, password } = data;
        if (!email || !password)
            throw new Error('Email and password are required');
        const result = await this.superAdminService.login(email, password);
        return {
            message: 'SuperAdmin login successful',
            superAdmin: {
                id: result.superAdmin.id,
                email: result.superAdmin.email,
                name: result.superAdmin.name,
                role: result.superAdmin.role,
                created_at: result.superAdmin.created_at,
            },
            access_token: result.accessToken,
            refresh_token: result.refreshToken,
        };
    }
    async superAdminRefreshToken(data) {
        const { refresh_token } = data;
        if (!refresh_token)
            throw new Error('Refresh token is required');
        const result = await this.superAdminService.refreshToken(refresh_token);
        return {
            message: 'Token rotated successfully',
            access_token: result.accessToken,
            refresh_token: result.refreshToken,
        };
    }
    async superAdminLogout(data) {
        const { refresh_token } = data;
        await this.superAdminService.logout(refresh_token);
        return { message: 'Logged out successfully' };
    }
    async superAdminGetProfile(data) {
        const { superadmin_id } = data;
        if (!superadmin_id)
            throw new Error('SuperAdmin ID is required');
        const profile = await this.superAdminService.getProfile(superadmin_id);
        return {
            superAdmin: {
                id: profile.id,
                email: profile.email,
                name: profile.name,
                role: profile.role,
                created_at: profile.created_at,
            }
        };
    }
};
__decorate([
    GrpcMethod('TenantAuthService', 'Register'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    GrpcMethod('TenantAuthService', 'VerifyEmail'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyEmail", null);
__decorate([
    GrpcMethod('TenantAuthService', 'Login'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    GrpcMethod('TenantAuthService', 'RefreshToken'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refreshToken", null);
__decorate([
    GrpcMethod('TenantAuthService', 'Logout'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    GrpcMethod('SuperAdminAuthService', 'Login'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "superAdminLogin", null);
__decorate([
    GrpcMethod('SuperAdminAuthService', 'RefreshToken'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "superAdminRefreshToken", null);
__decorate([
    GrpcMethod('SuperAdminAuthService', 'Logout'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "superAdminLogout", null);
__decorate([
    GrpcMethod('SuperAdminAuthService', 'GetProfile'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "superAdminGetProfile", null);
AuthController = __decorate([
    Controller(),
    UseFilters(new AllExceptionsFilter()),
    __metadata("design:paramtypes", [TenantService,
        SuperAdminService])
], AuthController);
export { AuthController };
