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
import { Controller, Inject } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { SCHEDULING_INVENTORY_SERVICE_NAME, } from '@repo/proto/scheduling';
import { CREATE_SERVICE_USE_CASE, GET_SERVICE_USE_CASE, LIST_SERVICES_USE_CASE, UPDATE_SERVICE_USE_CASE, DELETE_SERVICE_USE_CASE, } from '../../application/interfaces/service-use-cases.interface.js';
import { CREATE_RESOURCE_USE_CASE, GET_RESOURCE_USE_CASE, LIST_RESOURCES_USE_CASE, UPDATE_RESOURCE_USE_CASE, DELETE_RESOURCE_USE_CASE, } from '../../application/interfaces/resource-use-cases.interface.js';
import { ServiceMapper } from '../../infrastructure/database/mappers/service.mapper.js';
import { ResourceMapper } from '../../infrastructure/database/mappers/resource.mapper.js';
let SchedulingInventoryGrpcController = class SchedulingInventoryGrpcController {
    createServiceUseCase;
    getServiceUseCase;
    listServicesUseCase;
    updateServiceUseCase;
    deleteServiceUseCase;
    createResourceUseCase;
    getResourceUseCase;
    listResourcesUseCase;
    updateResourceUseCase;
    deleteResourceUseCase;
    constructor(createServiceUseCase, getServiceUseCase, listServicesUseCase, updateServiceUseCase, deleteServiceUseCase, createResourceUseCase, getResourceUseCase, listResourcesUseCase, updateResourceUseCase, deleteResourceUseCase) {
        this.createServiceUseCase = createServiceUseCase;
        this.getServiceUseCase = getServiceUseCase;
        this.listServicesUseCase = listServicesUseCase;
        this.updateServiceUseCase = updateServiceUseCase;
        this.deleteServiceUseCase = deleteServiceUseCase;
        this.createResourceUseCase = createResourceUseCase;
        this.getResourceUseCase = getResourceUseCase;
        this.listResourcesUseCase = listResourcesUseCase;
        this.updateResourceUseCase = updateResourceUseCase;
        this.deleteResourceUseCase = deleteResourceUseCase;
    }
    async createService(request) {
        const service = await this.createServiceUseCase.execute(request);
        return {
            service: ServiceMapper.toProto(service),
            message: 'Service created successfully',
        };
    }
    async getService(request) {
        const service = await this.getServiceUseCase.execute(request);
        return {
            service: ServiceMapper.toProto(service),
            message: 'Service retrieved successfully',
        };
    }
    async listServices(request) {
        const result = await this.listServicesUseCase.execute(request);
        return {
            services: result.services.map((s) => ServiceMapper.toProto(s)),
            total: result.total,
            page: result.page,
            limit: result.limit,
        };
    }
    async updateService(request) {
        const service = await this.updateServiceUseCase.execute(request);
        return {
            service: ServiceMapper.toProto(service),
            message: 'Service updated successfully',
        };
    }
    async deleteService(request) {
        const success = await this.deleteServiceUseCase.execute(request);
        return {
            success,
            message: 'Service deleted successfully',
        };
    }
    async createResource(request) {
        const resource = await this.createResourceUseCase.execute(request);
        return {
            resource: ResourceMapper.toProto(resource),
            message: 'Resource created successfully',
        };
    }
    async getResource(request) {
        const resource = await this.getResourceUseCase.execute(request);
        return {
            resource: ResourceMapper.toProto(resource),
            message: 'Resource retrieved successfully',
        };
    }
    async listResources(request) {
        const result = await this.listResourcesUseCase.execute(request);
        return {
            resources: result.resources.map((r) => ResourceMapper.toProto(r)),
            total: result.total,
            page: result.page,
            limit: result.limit,
        };
    }
    async updateResource(request) {
        const resource = await this.updateResourceUseCase.execute(request);
        return {
            resource: ResourceMapper.toProto(resource),
            message: 'Resource updated successfully',
        };
    }
    async deleteResource(request) {
        const success = await this.deleteResourceUseCase.execute(request);
        return {
            success,
            message: 'Resource deleted successfully',
        };
    }
};
__decorate([
    GrpcMethod(SCHEDULING_INVENTORY_SERVICE_NAME, 'CreateService'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SchedulingInventoryGrpcController.prototype, "createService", null);
__decorate([
    GrpcMethod(SCHEDULING_INVENTORY_SERVICE_NAME, 'GetService'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SchedulingInventoryGrpcController.prototype, "getService", null);
__decorate([
    GrpcMethod(SCHEDULING_INVENTORY_SERVICE_NAME, 'ListServices'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SchedulingInventoryGrpcController.prototype, "listServices", null);
__decorate([
    GrpcMethod(SCHEDULING_INVENTORY_SERVICE_NAME, 'UpdateService'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SchedulingInventoryGrpcController.prototype, "updateService", null);
__decorate([
    GrpcMethod(SCHEDULING_INVENTORY_SERVICE_NAME, 'DeleteService'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SchedulingInventoryGrpcController.prototype, "deleteService", null);
__decorate([
    GrpcMethod(SCHEDULING_INVENTORY_SERVICE_NAME, 'CreateResource'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SchedulingInventoryGrpcController.prototype, "createResource", null);
__decorate([
    GrpcMethod(SCHEDULING_INVENTORY_SERVICE_NAME, 'GetResource'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SchedulingInventoryGrpcController.prototype, "getResource", null);
__decorate([
    GrpcMethod(SCHEDULING_INVENTORY_SERVICE_NAME, 'ListResources'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SchedulingInventoryGrpcController.prototype, "listResources", null);
__decorate([
    GrpcMethod(SCHEDULING_INVENTORY_SERVICE_NAME, 'UpdateResource'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SchedulingInventoryGrpcController.prototype, "updateResource", null);
__decorate([
    GrpcMethod(SCHEDULING_INVENTORY_SERVICE_NAME, 'DeleteResource'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SchedulingInventoryGrpcController.prototype, "deleteResource", null);
SchedulingInventoryGrpcController = __decorate([
    Controller(),
    __param(0, Inject(CREATE_SERVICE_USE_CASE)),
    __param(1, Inject(GET_SERVICE_USE_CASE)),
    __param(2, Inject(LIST_SERVICES_USE_CASE)),
    __param(3, Inject(UPDATE_SERVICE_USE_CASE)),
    __param(4, Inject(DELETE_SERVICE_USE_CASE)),
    __param(5, Inject(CREATE_RESOURCE_USE_CASE)),
    __param(6, Inject(GET_RESOURCE_USE_CASE)),
    __param(7, Inject(LIST_RESOURCES_USE_CASE)),
    __param(8, Inject(UPDATE_RESOURCE_USE_CASE)),
    __param(9, Inject(DELETE_RESOURCE_USE_CASE)),
    __metadata("design:paramtypes", [Object, Object, Object, Object, Object, Object, Object, Object, Object, Object])
], SchedulingInventoryGrpcController);
export { SchedulingInventoryGrpcController };
