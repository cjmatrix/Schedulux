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
import { SuperAdminProto } from '@repo/proto';
import { GRPC_METHODS, GRPC_SERVICES } from '../constants/grpc.constant.js';
import { RESPONSE_MESSAGES } from '../constants/messages.constant.js';
import { AllExceptionsFilter } from './rpcExpetionFilter.js';
let SuperAdminAuthController = class SuperAdminAuthController {
    _superAdminService;
    constructor(_superAdminService) {
        this._superAdminService = _superAdminService;
    }
    async superAdminLogin(data) {
        const { email, password } = data;
        if (!email || !password)
            throw new Error(RESPONSE_MESSAGES.ERRORS.EMAIL_AND_PASSWORD_REQUIRED);
        const result = await this._superAdminService.login(email, password);
        return {
            message: RESPONSE_MESSAGES.AUTH.SUPERADMIN_LOGIN_SUCCESS,
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
            throw new Error(RESPONSE_MESSAGES.ERRORS.REFRESH_TOKEN_REQUIRED_INPUT);
        const result = await this._superAdminService.refreshToken(refresh_token);
        return {
            message: RESPONSE_MESSAGES.AUTH.TOKEN_ROTATED_SUCCESS,
            access_token: result.accessToken,
            refresh_token: result.refreshToken,
        };
    }
    async superAdminLogout(data) {
        const { refresh_token } = data;
        await this._superAdminService.logout(refresh_token);
        return { message: RESPONSE_MESSAGES.AUTH.LOGGED_OUT_SUCCESS };
    }
    async superAdminGetProfile(data) {
        const { superadmin_id } = data;
        if (!superadmin_id)
            throw new Error(RESPONSE_MESSAGES.ERRORS.SUPERADMIN_ID_REQUIRED);
        const profile = await this._superAdminService.getProfile(superadmin_id);
        return {
            superAdmin: {
                id: profile.id,
                email: profile.email,
                name: profile.name,
                role: profile.role,
                created_at: profile.created_at,
            },
        };
    }
    async superAdminGetTenantList(data) {
        const lists = await this._superAdminService.ListTenants(data);
        return lists;
    }
    async suspendTenant(data) {
        if (!data.tenant_id)
            throw new Error(RESPONSE_MESSAGES.ERRORS.TENANT_ID_REQUIRED);
        return this._superAdminService.suspendTenant(data.tenant_id);
    }
};
__decorate([
    GrpcMethod(GRPC_SERVICES.SUPERADMIN_AUTH, GRPC_METHODS.SUPERADMIN_AUTH.LOGIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SuperAdminAuthController.prototype, "superAdminLogin", null);
__decorate([
    GrpcMethod(GRPC_SERVICES.SUPERADMIN_AUTH, GRPC_METHODS.SUPERADMIN_AUTH.REFRESH_TOKEN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SuperAdminAuthController.prototype, "superAdminRefreshToken", null);
__decorate([
    GrpcMethod(GRPC_SERVICES.SUPERADMIN_AUTH, GRPC_METHODS.SUPERADMIN_AUTH.LOGOUT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SuperAdminAuthController.prototype, "superAdminLogout", null);
__decorate([
    GrpcMethod(GRPC_SERVICES.SUPERADMIN_AUTH, GRPC_METHODS.SUPERADMIN_AUTH.GET_PROFILE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SuperAdminAuthController.prototype, "superAdminGetProfile", null);
__decorate([
    GrpcMethod(GRPC_SERVICES.TENANT, GRPC_METHODS.TENANT.LIST_TENANTS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SuperAdminAuthController.prototype, "superAdminGetTenantList", null);
__decorate([
    GrpcMethod(GRPC_SERVICES.TENANT, GRPC_METHODS.TENANT.SUSPEND_TENANT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SuperAdminAuthController.prototype, "suspendTenant", null);
SuperAdminAuthController = __decorate([
    Controller(),
    UseFilters(new AllExceptionsFilter()),
    __param(0, Inject('ISuperAdminService')),
    __metadata("design:paramtypes", [Object])
], SuperAdminAuthController);
export { SuperAdminAuthController };
