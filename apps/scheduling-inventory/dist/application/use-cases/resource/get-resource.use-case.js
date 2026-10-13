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
import { RESOURCE_REPOSITORY } from '../../../domain/tokens.js';
let GetResourceUseCase = class GetResourceUseCase {
    resourceRepository;
    constructor(resourceRepository) {
        this.resourceRepository = resourceRepository;
    }
    async execute(dto) {
        const resource = await this.resourceRepository.findById(dto.tenant_id, dto.resource_id);
        if (!resource) {
            throw new NotFoundException(`Resource ${dto.resource_id} not found for tenant ${dto.tenant_id}`);
        }
        return resource;
    }
};
GetResourceUseCase = __decorate([
    Injectable(),
    __param(0, Inject(RESOURCE_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], GetResourceUseCase);
export { GetResourceUseCase };
