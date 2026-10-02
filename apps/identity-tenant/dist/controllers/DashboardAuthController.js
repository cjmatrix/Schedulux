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
import { AllExceptionsFilter } from "./rpcExpetionFilter.js";
let DashboardAuthController = class DashboardAuthController {
    dashboardUserService;
    constructor(dashboardUserService) {
        this.dashboardUserService = dashboardUserService;
    }
    async login(data) {
        if (!data.email || !data.password) {
            throw new Error("Email and password are required");
        }
        return await this.dashboardUserService.login(data);
    }
};
__decorate([
    GrpcMethod("DashboardAuthService", "Login"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardAuthController.prototype, "login", null);
DashboardAuthController = __decorate([
    Controller(),
    UseFilters(new AllExceptionsFilter()),
    __param(0, Inject(DashboardUserService)),
    __metadata("design:paramtypes", [DashboardUserService])
], DashboardAuthController);
export { DashboardAuthController };
