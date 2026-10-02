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
exports.SuperAdminTenantController = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const nestjs_zod_1 = require("nestjs-zod");
const superadmin_auth_guard_js_1 = require("../../guards/superadmin-auth.guard.js");
const superAdmin_dto_js_1 = require("./dtos/superAdmin.dto.js");
let SuperAdminTenantController = class SuperAdminTenantController {
    client;
    superAdminTenantClient;
    constructor(client) {
        this.client = client;
    }
    onModuleInit() {
        this.superAdminTenantClient = this.client.getService("TenantService");
    }
    async ListTenants(query) {
        const lists = await (0, rxjs_1.lastValueFrom)(this.superAdminTenantClient.listTenants({
            page: query.page,
            limit: query.limit,
            search: query.search,
            tier: query.tier,
            status: query.status,
        }));
        return {
            message: "successfull",
            data: lists,
        };
    }
    async SuspendTenant(params) {
        const result = await (0, rxjs_1.lastValueFrom)(this.superAdminTenantClient.suspendTenant({ tenant_id: params.id }));
        return {
            message: "Tenant suspended successfully",
            data: result,
        };
    }
};
exports.SuperAdminTenantController = SuperAdminTenantController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [superAdmin_dto_js_1.ListTenantsDto]),
    __metadata("design:returntype", Promise)
], SuperAdminTenantController.prototype, "ListTenants", null);
__decorate([
    (0, common_1.Patch)(":id/suspend"),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [superAdmin_dto_js_1.SuspendTenantParamDto]),
    __metadata("design:returntype", Promise)
], SuperAdminTenantController.prototype, "SuspendTenant", null);
exports.SuperAdminTenantController = SuperAdminTenantController = __decorate([
    (0, common_1.Controller)(`api/v1/admin/tenants`),
    (0, common_1.UseGuards)(superadmin_auth_guard_js_1.SuperAdminAuthGuard),
    __param(0, (0, common_1.Inject)("TENANT_PACKAGE")),
    __metadata("design:paramtypes", [Object])
], SuperAdminTenantController);
