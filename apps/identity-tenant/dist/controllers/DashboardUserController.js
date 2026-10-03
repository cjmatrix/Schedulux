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
import { Controller, UseFilters, Inject } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { DashboardUserService } from "../services/dashboardUserService.js";
import { TenantService } from "../services/tenantService.js";
import { AllExceptionsFilter } from "./rpcExpetionFilter.js";
let DashboardUserController = class DashboardUserController {
    dashboardUserService;
    tenantService;
    constructor(dashboardUserService, tenantService) {
        this.dashboardUserService = dashboardUserService;
        this.tenantService = tenantService;
    }
    async login(data) {
        if (!data.email || !data.password) {
            throw new Error("Email and password are required");
        }
        return await this.dashboardUserService.login(data);
    }
    async getProfile(data) {
        return await this.dashboardUserService.getProfile(data);
    }
    async refreshToken(data) {
        return await this.dashboardUserService.refreshToken(data);
    }
    async forgotPassword(data) {
        if (!data.email)
            throw new Error("Email is required");
        return await this.dashboardUserService.forgotPassword(data.email);
    }
    async resetPassword(data) {
        if (!data.token || !data.new_password)
            throw new Error("Token and new password are required");
        return await this.dashboardUserService.resetPassword(data.token, data.new_password);
    }
    async inviteUser(data) {
        const { tenant_id, email, name, system_role } = data;
        if (!tenant_id || !email || !name) {
            throw new Error("Missing required fields");
        }
        return await this.tenantService.inviteUser({
            tenant_id,
            email,
            name,
            system_role: system_role,
        });
    }
    async listWorkspaceUsers(data) {
        if (!data.tenant_id)
            throw new Error("Tenant ID is required");
        return await this.tenantService.listWorkspaceUsers(data);
    }
};
__decorate([
    GrpcMethod("DashboardAuthService", "Login"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardUserController.prototype, "login", null);
__decorate([
    GrpcMethod("DashboardAuthService", "GetProfile"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardUserController.prototype, "getProfile", null);
__decorate([
    GrpcMethod("DashboardAuthService", "RefreshToken"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardUserController.prototype, "refreshToken", null);
__decorate([
    GrpcMethod("DashboardAuthService", "ForgotPassword"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardUserController.prototype, "forgotPassword", null);
__decorate([
    GrpcMethod("DashboardAuthService", "ResetPassword"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardUserController.prototype, "resetPassword", null);
__decorate([
    GrpcMethod("DashboardUserService", "InviteUser"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardUserController.prototype, "inviteUser", null);
__decorate([
    GrpcMethod("DashboardUserService", "ListWorkspaceUsers"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardUserController.prototype, "listWorkspaceUsers", null);
DashboardUserController = __decorate([
    Controller(),
    UseFilters(new AllExceptionsFilter()),
    __param(0, Inject(DashboardUserService)),
    __param(1, Inject(TenantService)),
    __metadata("design:paramtypes", [DashboardUserService,
        TenantService])
], DashboardUserController);
export { DashboardUserController };
