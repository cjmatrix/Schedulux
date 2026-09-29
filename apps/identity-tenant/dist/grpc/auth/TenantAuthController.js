var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Controller, UseFilters } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { TenantService } from '../../services/tenantService.js';
import { AllExceptionsFilter } from './rpcExpetionFilter.js';
let TenantAuthController = class TenantAuthController {
    tenantService;
    constructor(tenantService) {
        this.tenantService = tenantService;
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
};
__decorate([
    GrpcMethod('TenantAuthService', 'Register'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TenantAuthController.prototype, "register", null);
__decorate([
    GrpcMethod('TenantAuthService', 'VerifyEmail'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TenantAuthController.prototype, "verifyEmail", null);
__decorate([
    GrpcMethod('TenantAuthService', 'Login'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TenantAuthController.prototype, "login", null);
__decorate([
    GrpcMethod('TenantAuthService', 'RefreshToken'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TenantAuthController.prototype, "refreshToken", null);
__decorate([
    GrpcMethod('TenantAuthService', 'Logout'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TenantAuthController.prototype, "logout", null);
TenantAuthController = __decorate([
    Controller(),
    UseFilters(new AllExceptionsFilter()),
    __metadata("design:paramtypes", [TenantService])
], TenantAuthController);
export { TenantAuthController };
