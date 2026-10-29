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
let DashboardUserController = class DashboardUserController {
    _dashboardUserService;
    _tenantService;
    constructor(_dashboardUserService, _tenantService) {
        this._dashboardUserService = _dashboardUserService;
        this._tenantService = _tenantService;
    }
    async login(data) {
        if (!data.email || !data.password) {
            throw new Error(RESPONSE_MESSAGES.ERRORS.EMAIL_AND_PASSWORD_REQUIRED);
        }
        return await this._dashboardUserService.login(data);
    }
    async getProfile(data) {
        return await this._dashboardUserService.getProfile(data);
    }
    async refreshToken(data) {
        return await this._dashboardUserService.refreshToken(data);
    }
    async forgotPassword(data) {
        if (!data.email)
            throw new Error(RESPONSE_MESSAGES.ERRORS.EMAIL_REQUIRED);
        return await this._dashboardUserService.forgotPassword(data.email);
    }
    async resetPassword(data) {
        if (!data.token || !data.new_password)
            throw new Error(RESPONSE_MESSAGES.ERRORS.TOKEN_AND_NEW_PASSWORD_REQUIRED);
        return await this._dashboardUserService.resetPassword(data.token, data.new_password);
    }
    async inviteUser(data) {
        const { tenant_id, email, name, system_role } = data;
        if (!tenant_id || !email || !name) {
            throw new Error(RESPONSE_MESSAGES.ERRORS.MISSING_REQUIRED_FIELDS);
        }
        return await this._tenantService.inviteUser({
            tenant_id,
            email,
            name,
            system_role: system_role,
        });
    }
    async listWorkspaceUsers(data) {
        if (!data.tenant_id)
            throw new Error(RESPONSE_MESSAGES.ERRORS.TENANT_ID_REQUIRED);
        return await this._tenantService.listWorkspaceUsers(data);
    }
};
__decorate([
    GrpcMethod(GRPC_SERVICES.DASHBOARD_AUTH, GRPC_METHODS.DASHBOARD_AUTH.LOGIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardUserController.prototype, "login", null);
__decorate([
    GrpcMethod(GRPC_SERVICES.DASHBOARD_AUTH, GRPC_METHODS.DASHBOARD_AUTH.GET_PROFILE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardUserController.prototype, "getProfile", null);
__decorate([
    GrpcMethod(GRPC_SERVICES.DASHBOARD_AUTH, GRPC_METHODS.DASHBOARD_AUTH.REFRESH_TOKEN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardUserController.prototype, "refreshToken", null);
__decorate([
    GrpcMethod(GRPC_SERVICES.DASHBOARD_AUTH, GRPC_METHODS.DASHBOARD_AUTH.FORGOT_PASSWORD),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardUserController.prototype, "forgotPassword", null);
__decorate([
    GrpcMethod(GRPC_SERVICES.DASHBOARD_AUTH, GRPC_METHODS.DASHBOARD_AUTH.RESET_PASSWORD),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardUserController.prototype, "resetPassword", null);
__decorate([
    GrpcMethod(GRPC_SERVICES.DASHBOARD_USER, GRPC_METHODS.DASHBOARD_USER.INVITE_USER),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardUserController.prototype, "inviteUser", null);
__decorate([
    GrpcMethod(GRPC_SERVICES.DASHBOARD_USER, GRPC_METHODS.DASHBOARD_USER.LIST_WORKSPACE_USERS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardUserController.prototype, "listWorkspaceUsers", null);
DashboardUserController = __decorate([
    Controller(),
    UseFilters(new AllExceptionsFilter()),
    __param(0, Inject('IDashboardUserService')),
    __param(1, Inject('ITenantService')),
    __metadata("design:paramtypes", [Object, Object])
], DashboardUserController);
export { DashboardUserController };
