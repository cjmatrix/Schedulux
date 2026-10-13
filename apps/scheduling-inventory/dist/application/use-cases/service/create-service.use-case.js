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
import { ServiceEntity } from '../../../domain/entities/service.entity.js';
import { PriceVO } from '../../../domain/value-objects/price.vo.js';
import { DepositVO } from '../../../domain/value-objects/deposit.vo.js';
import { generateSemanticId } from '../../../domain/utils/id-generator.js';
let CreateServiceUseCase = class CreateServiceUseCase {
    serviceRepository;
    constructor(serviceRepository) {
        this.serviceRepository = serviceRepository;
    }
    async execute(dto) {
        const serviceId = generateSemanticId('srv', dto.name);
        const price = PriceVO.create(dto.price?.type, dto.price?.amount, dto.price?.currency);
        const deposit = DepositVO.create({
            required: dto.deposit?.required,
            amount: dto.deposit?.amount,
            processor: dto.deposit?.processor,
            upiId: dto.deposit?.upi_id,
            qrCodeUrl: dto.deposit?.qr_code_url,
            confirmationMethod: dto.deposit?.confirmation_method,
            paymentInstructions: dto.deposit?.payment_instructions,
        });
        const service = new ServiceEntity({
            id: serviceId,
            tenantId: dto.tenant_id,
            name: dto.name,
            category: dto.category || 'General',
            description: dto.description || '',
            durationMinutes: dto.duration_minutes || 30,
            bufferMinutes: dto.buffer_minutes || 0,
            allocationModel: dto.allocation_model || 'single_resource',
            price,
            deposit,
            eligibleResourceIds: dto.eligible_resource_ids ?? [],
            requiredAssetIds: dto.required_asset_ids ?? [],
            recallIntervalDays: dto.recall_interval_days || 0,
        });
        return this.serviceRepository.create(service);
    }
};
CreateServiceUseCase = __decorate([
    Injectable(),
    __param(0, Inject(SERVICE_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], CreateServiceUseCase);
export { CreateServiceUseCase };
