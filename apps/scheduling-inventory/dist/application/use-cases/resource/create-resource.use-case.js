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
import { RESOURCE_REPOSITORY } from '../../../domain/tokens.js';
import { ResourceEntity } from '../../../domain/entities/resource.entity.js';
import { generateSemanticId } from '../../../domain/utils/id-generator.js';
let CreateResourceUseCase = class CreateResourceUseCase {
    resourceRepository;
    constructor(resourceRepository) {
        this.resourceRepository = resourceRepository;
    }
    async execute(dto) {
        const resourceId = generateSemanticId('res', dto.name);
        const resource = new ResourceEntity({
            id: resourceId,
            tenantId: dto.tenant_id,
            resourceType: dto.resource_type || 'staff',
            name: dto.name,
            title: dto.title || '',
            category: dto.category || 'General',
            description: dto.description || '',
            isBookable: dto.is_bookable !== undefined ? dto.is_bookable : true,
            dispatchStatus: dto.dispatch_status || 'active',
            customShiftOverridesJson: dto.custom_shift_overrides_json || '{}',
        });
        return this.resourceRepository.create(resource);
    }
};
CreateResourceUseCase = __decorate([
    Injectable(),
    __param(0, Inject(RESOURCE_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], CreateResourceUseCase);
export { CreateResourceUseCase };
