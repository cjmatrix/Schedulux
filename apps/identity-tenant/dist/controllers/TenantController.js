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
import { Controller, Inject, UseFilters } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { GRPC_METHODS, GRPC_SERVICES } from '../constants/grpc.constant.js';
import { RESPONSE_MESSAGES } from '../constants/messages.constant.js';
import { AllExceptionsFilter } from './rpcExpetionFilter.js';
let TenantAuthController = class TenantAuthController {
    _tenantService;
    constructor(_tenantService) {
        this._tenantService = _tenantService;
    }
    async register(data) {
        const { business_name, full_name, email, password } = data;
        if (!business_name || !full_name || !email || !password) {
            throw new Error(RESPONSE_MESSAGES.ERRORS.MISSING_REQUIRED_FIELDS);
        }
        return await this._tenantService.register({
            business_name,
            full_name,
            email,
            password,
        });
    }
    async verifyEmail(data) {
        const { token } = data;
        if (!token)
            throw new Error(RESPONSE_MESSAGES.ERRORS.VERIFICATION_TOKEN_REQUIRED);
        return await this._tenantService.verifyEmail(token);
    }
    async login(data) {
        const { email, password } = data;
        if (!email || !password)
            throw new Error(RESPONSE_MESSAGES.ERRORS.EMAIL_AND_PASSWORD_REQUIRED);
        const result = await this._tenantService.login(email, password);
        return {
            message: RESPONSE_MESSAGES.AUTH.LOGIN_SUCCESS,
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
    async googleLogin(data) {
        const { id_token } = data;
        if (!id_token)
            throw new Error(RESPONSE_MESSAGES.ERRORS.GOOGLE_ID_TOKEN_REQUIRED_INPUT);
        const result = await this._tenantService.googleLogin(id_token);
        return {
            message: RESPONSE_MESSAGES.AUTH.GOOGLE_LOGIN_SUCCESS,
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
            throw new Error(RESPONSE_MESSAGES.ERRORS.REFRESH_TOKEN_REQUIRED_INPUT);
        const result = await this._tenantService.refreshToken(refresh_token);
        return {
            message: RESPONSE_MESSAGES.AUTH.TOKEN_ROTATED_SUCCESS,
            access_token: result.accessToken,
            refresh_token: result.refreshToken,
        };
    }
    async getProfile(data) {
        const { tenant_id } = data;
        if (!tenant_id)
            throw new Error(RESPONSE_MESSAGES.ERRORS.TENANT_ID_REQUIRED);
        return await this._tenantService.getProfile(tenant_id);
    }
    async logout(data) {
        const { refresh_token } = data;
        await this._tenantService.logout(refresh_token);
        return { message: RESPONSE_MESSAGES.AUTH.LOGGED_OUT_SUCCESS };
    }
    async forgotPassword(data) {
        const { email } = data;
        if (!email)
            throw new Error(RESPONSE_MESSAGES.ERRORS.EMAIL_REQUIRED);
        return await this._tenantService.forgotPassword(email);
    }
    async resetPassword(data) {
        const { token, new_password } = data;
        if (!token || !new_password)
            throw new Error(RESPONSE_MESSAGES.ERRORS.TOKEN_AND_NEW_PASSWORD_REQUIRED);
        return await this._tenantService.resetPassword(token, new_password);
    }
};
__decorate([
    GrpcMethod(GRPC_SERVICES.TENANT_AUTH, GRPC_METHODS.TENANT_AUTH.REGISTER),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TenantAuthController.prototype, "register", null);
__decorate([
    GrpcMethod(GRPC_SERVICES.TENANT_AUTH, GRPC_METHODS.TENANT_AUTH.VERIFY_EMAIL),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TenantAuthController.prototype, "verifyEmail", null);
__decorate([
    GrpcMethod(GRPC_SERVICES.TENANT_AUTH, GRPC_METHODS.TENANT_AUTH.LOGIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TenantAuthController.prototype, "login", null);
__decorate([
    GrpcMethod(GRPC_SERVICES.TENANT_AUTH, GRPC_METHODS.TENANT_AUTH.GOOGLE_LOGIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TenantAuthController.prototype, "googleLogin", null);
__decorate([
    GrpcMethod(GRPC_SERVICES.TENANT_AUTH, GRPC_METHODS.TENANT_AUTH.REFRESH_TOKEN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TenantAuthController.prototype, "refreshToken", null);
__decorate([
    GrpcMethod(GRPC_SERVICES.TENANT_AUTH, GRPC_METHODS.TENANT_AUTH.GET_PROFILE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TenantAuthController.prototype, "getProfile", null);
__decorate([
    GrpcMethod(GRPC_SERVICES.TENANT_AUTH, GRPC_METHODS.TENANT_AUTH.LOGOUT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TenantAuthController.prototype, "logout", null);
__decorate([
    GrpcMethod(GRPC_SERVICES.TENANT_AUTH, GRPC_METHODS.TENANT_AUTH.FORGOT_PASSWORD),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TenantAuthController.prototype, "forgotPassword", null);
__decorate([
    GrpcMethod(GRPC_SERVICES.TENANT_AUTH, GRPC_METHODS.TENANT_AUTH.RESET_PASSWORD),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TenantAuthController.prototype, "resetPassword", null);
TenantAuthController = __decorate([
    Controller(),
    UseFilters(new AllExceptionsFilter()),
    __param(0, Inject('ITenantService')),
    __metadata("design:paramtypes", [Object])
], TenantAuthController);
export { TenantAuthController };
