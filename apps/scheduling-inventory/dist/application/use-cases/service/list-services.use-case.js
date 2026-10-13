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
import { Inject, Injectable } from '@nestjs/common';
import { SERVICE_REPOSITORY } from '../../../domain/tokens.js';
let ListServicesUseCase = class ListServicesUseCase {
    serviceRepository;
    constructor(serviceRepository) {
        this.serviceRepository = serviceRepository;
    }
    async execute(dto) {
        const page = dto.page > 0 ? dto.page : 1;
        const limit = dto.limit > 0 ? dto.limit : 20;
        const { services, total } = await this.serviceRepository.findAll(dto.tenant_id, {
            page,
            limit,
            category: dto.category || undefined,
        });
        return { services, total, page, limit };
    }
};
ListServicesUseCase = __decorate([
    Injectable(),
    __param(0, Inject(SERVICE_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], ListServicesUseCase);
export { ListServicesUseCase };
