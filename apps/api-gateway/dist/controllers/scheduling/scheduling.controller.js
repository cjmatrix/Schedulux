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
exports.SchedulingController = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const nestjs_zod_1 = require("nestjs-zod");
const scheduling_1 = require("@repo/proto/scheduling");
const tenant_auth_guard_js_1 = require("../../guards/tenant-auth.guard.js");
const roles_guard_js_1 = require("../../guards/roles.guard.js");
const roles_decorator_js_1 = require("../../decorators/roles.decorator.js");
const service_dto_js_1 = require("./dtos/service.dto.js");
const resource_dto_js_1 = require("./dtos/resource.dto.js");
let SchedulingController = class SchedulingController {
    client;
    schedulingService;
    constructor(client) {
        this.client = client;
    }
    onModuleInit() {
        this.schedulingService = this.client.getService(scheduling_1.SCHEDULING_INVENTORY_SERVICE_NAME);
    }
    getTenantId(req) {
        const tenantId = req.tenant?.tenant_id || req.dashboardUser?.tenant_id;
        if (!tenantId) {
            throw new common_1.UnauthorizedException('Tenant context missing from token');
        }
        return tenantId;
    }
    // ==========================================
    // SERVICES ENDPOINTS
    // ==========================================
    async createService(req, body) {
        const tenantId = this.getTenantId(req);
        const response = await (0, rxjs_1.lastValueFrom)(this.schedulingService.createService({
            tenant_id: tenantId,
            name: body.name,
            category: body.category,
            description: body.description,
            duration_minutes: body.duration_minutes,
            buffer_minutes: body.buffer_minutes,
            allocation_model: body.allocation_model,
            price: body.price,
            deposit: body.deposit,
            eligible_resource_ids: body.eligible_resource_ids,
            required_asset_ids: body.required_asset_ids,
            recall_interval_days: body.recall_interval_days,
        }));
        return {
            message: response.message,
            data: response.service,
        };
    }
    async listServices(req, query) {
        const tenantId = this.getTenantId(req);
        const response = await (0, rxjs_1.lastValueFrom)(this.schedulingService.listServices({
            tenant_id: tenantId,
            page: query.page,
            limit: query.limit,
            category: query.category || '',
        }));
        return {
            message: 'Services retrieved successfully',
            data: response.services,
            pagination: {
                total: response.total,
                page: response.page,
                limit: response.limit,
            },
        };
    }
    async getService(req, serviceId) {
        const tenantId = this.getTenantId(req);
        const response = await (0, rxjs_1.lastValueFrom)(this.schedulingService.getService({
            tenant_id: tenantId,
            service_id: serviceId,
        }));
        return {
            message: response.message,
            data: response.service,
        };
    }
    async updateService(req, serviceId, body) {
        const tenantId = this.getTenantId(req);
        const response = await (0, rxjs_1.lastValueFrom)(this.schedulingService.updateService({
            tenant_id: tenantId,
            service_id: serviceId,
            name: body.name,
            category: body.category,
            description: body.description,
            duration_minutes: body.duration_minutes,
            buffer_minutes: body.buffer_minutes,
            allocation_model: body.allocation_model,
            price: body.price,
            deposit: body.deposit,
            eligible_resource_ids: body.eligible_resource_ids ?? [],
            required_asset_ids: body.required_asset_ids ?? [],
            recall_interval_days: body.recall_interval_days,
        }));
        return {
            message: response.message,
            data: response.service,
        };
    }
    async deleteService(req, serviceId) {
        const tenantId = this.getTenantId(req);
        const response = await (0, rxjs_1.lastValueFrom)(this.schedulingService.deleteService({
            tenant_id: tenantId,
            service_id: serviceId,
        }));
        return {
            message: response.message,
            success: response.success,
        };
    }
    // ==========================================
    // RESOURCES ENDPOINTS
    // ==========================================
    async createResource(req, body) {
        const tenantId = this.getTenantId(req);
        const response = await (0, rxjs_1.lastValueFrom)(this.schedulingService.createResource({
            tenant_id: tenantId,
            resource_type: body.resource_type,
            name: body.name,
            title: body.title,
            category: body.category,
            description: body.description,
            is_bookable: body.is_bookable,
            dispatch_status: body.dispatch_status,
            custom_shift_overrides_json: body.custom_shift_overrides_json,
        }));
        return {
            message: response.message,
            data: response.resource,
        };
    }
    async listResources(req, query) {
        const tenantId = this.getTenantId(req);
        const response = await (0, rxjs_1.lastValueFrom)(this.schedulingService.listResources({
            tenant_id: tenantId,
            page: query.page,
            limit: query.limit,
            resource_type: query.resource_type || '',
            dispatch_status: query.dispatch_status || '',
        }));
        return {
            message: 'Resources retrieved successfully',
            data: response.resources,
            pagination: {
                total: response.total,
                page: response.page,
                limit: response.limit,
            },
        };
    }
    async getResource(req, resourceId) {
        const tenantId = this.getTenantId(req);
        const response = await (0, rxjs_1.lastValueFrom)(this.schedulingService.getResource({
            tenant_id: tenantId,
            resource_id: resourceId,
        }));
        return {
            message: response.message,
            data: response.resource,
        };
    }
    async updateResource(req, resourceId, body) {
        const tenantId = this.getTenantId(req);
        const response = await (0, rxjs_1.lastValueFrom)(this.schedulingService.updateResource({
            tenant_id: tenantId,
            resource_id: resourceId,
            resource_type: body.resource_type,
            name: body.name,
            title: body.title,
            category: body.category,
            description: body.description,
            is_bookable: body.is_bookable,
            dispatch_status: body.dispatch_status,
            custom_shift_overrides_json: body.custom_shift_overrides_json,
        }));
        return {
            message: response.message,
            data: response.resource,
        };
    }
    async deleteResource(req, resourceId) {
        const tenantId = this.getTenantId(req);
        const response = await (0, rxjs_1.lastValueFrom)(this.schedulingService.deleteResource({
            tenant_id: tenantId,
            resource_id: resourceId,
        }));
        return {
            message: response.message,
            success: response.success,
        };
    }
};
exports.SchedulingController = SchedulingController;
__decorate([
    (0, common_1.Post)('services'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, service_dto_js_1.CreateServiceDto]),
    __metadata("design:returntype", Promise)
], SchedulingController.prototype, "createService", null);
__decorate([
    (0, common_1.Get)('services'),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, service_dto_js_1.ListServicesQueryDto]),
    __metadata("design:returntype", Promise)
], SchedulingController.prototype, "listServices", null);
__decorate([
    (0, common_1.Get)('services/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SchedulingController.prototype, "getService", null);
__decorate([
    (0, common_1.Put)('services/:id'),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, service_dto_js_1.UpdateServiceDto]),
    __metadata("design:returntype", Promise)
], SchedulingController.prototype, "updateService", null);
__decorate([
    (0, common_1.Delete)('services/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SchedulingController.prototype, "deleteService", null);
__decorate([
    (0, common_1.Post)('resources'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, resource_dto_js_1.CreateResourceDto]),
    __metadata("design:returntype", Promise)
], SchedulingController.prototype, "createResource", null);
__decorate([
    (0, common_1.Get)('resources'),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, resource_dto_js_1.ListResourcesQueryDto]),
    __metadata("design:returntype", Promise)
], SchedulingController.prototype, "listResources", null);
__decorate([
    (0, common_1.Get)('resources/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SchedulingController.prototype, "getResource", null);
__decorate([
    (0, common_1.Put)('resources/:id'),
    (0, common_1.UsePipes)(nestjs_zod_1.ZodValidationPipe),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, resource_dto_js_1.UpdateResourceDto]),
    __metadata("design:returntype", Promise)
], SchedulingController.prototype, "updateResource", null);
__decorate([
    (0, common_1.Delete)('resources/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SchedulingController.prototype, "deleteResource", null);
exports.SchedulingController = SchedulingController = __decorate([
    (0, common_1.Controller)('api/v1/tenant/scheduling'),
    (0, common_1.UseGuards)(tenant_auth_guard_js_1.TenantAuthGuard, roles_guard_js_1.RolesGuard),
    (0, roles_decorator_js_1.Roles)('tenant_owner', 'root', 'manager', 'dashboard_user'),
    __param(0, (0, common_1.Inject)('SCHEDULING_PACKAGE')),
    __metadata("design:paramtypes", [Object])
], SchedulingController);
