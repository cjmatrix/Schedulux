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
let SuperAdminTenantController = class SuperAdminTenantController {
    client;
    superAdminTenantClient;
    constructor(client) {
        this.client = client;
    }
    onModuleInit() {
        this.superAdminTenantClient = this.client.getService('TenantService');
    }
    async ListTenants(req, res) {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search ? String(req.query.search) : undefined;
        const tier = req.query.tier ? String(req.query.tier) : undefined;
        const status = req.query.status ? String(req.query.status) : undefined;
        const lists = await (0, rxjs_1.lastValueFrom)(this.superAdminTenantClient.listTenants({ page, limit, search, tier, status }));
        res.json({
            message: "successfull",
            data: lists
        });
    }
    async SuspendTenant(id, req, res) {
        const result = await (0, rxjs_1.lastValueFrom)(this.superAdminTenantClient.suspendTenant({ tenant_id: id }));
        res.json({
            message: "Tenant suspended successfully",
            data: result
        });
    }
};
exports.SuperAdminTenantController = SuperAdminTenantController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminTenantController.prototype, "ListTenants", null);
__decorate([
    (0, common_1.Patch)(':id/suspend'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminTenantController.prototype, "SuspendTenant", null);
exports.SuperAdminTenantController = SuperAdminTenantController = __decorate([
    (0, common_1.Controller)(`api/v1/admin/tenants`),
    __param(0, (0, common_1.Inject)('TENANT_PACKAGE')),
    __metadata("design:paramtypes", [Object])
], SuperAdminTenantController);
