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
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SERVICE_REPOSITORY } from '../../../domain/tokens.js';
let DeleteServiceUseCase = class DeleteServiceUseCase {
    serviceRepository;
    constructor(serviceRepository) {
        this.serviceRepository = serviceRepository;
    }
    async execute(dto) {
        const deleted = await this.serviceRepository.delete(dto.tenant_id, dto.service_id);
        if (!deleted) {
            throw new NotFoundException(`Service ${dto.service_id} not found for tenant ${dto.tenant_id}`);
        }
        return true;
    }
};
DeleteServiceUseCase = __decorate([
    Injectable(),
    __param(0, Inject(SERVICE_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], DeleteServiceUseCase);
export { DeleteServiceUseCase };
