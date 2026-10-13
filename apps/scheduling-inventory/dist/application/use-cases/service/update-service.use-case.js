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
import { PriceVO } from '../../../domain/value-objects/price.vo.js';
import { DepositVO } from '../../../domain/value-objects/deposit.vo.js';
let UpdateServiceUseCase = class UpdateServiceUseCase {
    serviceRepository;
    constructor(serviceRepository) {
        this.serviceRepository = serviceRepository;
    }
    async execute(dto) {
        const existing = await this.serviceRepository.findById(dto.tenant_id, dto.service_id);
        if (!existing) {
            throw new NotFoundException(`Service ${dto.service_id} not found for tenant ${dto.tenant_id}`);
        }
        const price = dto.price
            ? PriceVO.create(dto.price.type, dto.price.amount, dto.price.currency)
            : undefined;
        const deposit = dto.deposit
            ? DepositVO.create({
                required: dto.deposit.required,
                amount: dto.deposit.amount,
                processor: dto.deposit.processor,
                upiId: dto.deposit.upi_id,
                qrCodeUrl: dto.deposit.qr_code_url,
                confirmationMethod: dto.deposit.confirmation_method,
                paymentInstructions: dto.deposit.payment_instructions,
            })
            : undefined;
        existing.updateDetails({
            name: dto.name,
            category: dto.category,
            description: dto.description,
            durationMinutes: dto.duration_minutes,
            bufferMinutes: dto.buffer_minutes,
            allocationModel: dto.allocation_model,
            price,
            deposit,
            eligibleResourceIds: dto.eligible_resource_ids?.length ? dto.eligible_resource_ids : undefined,
            requiredAssetIds: dto.required_asset_ids?.length ? dto.required_asset_ids : undefined,
            recallIntervalDays: dto.recall_interval_days,
        });
        const updated = await this.serviceRepository.update(existing);
        if (!updated) {
            throw new NotFoundException(`Failed to update service ${dto.service_id}`);
        }
        return updated;
    }
};
UpdateServiceUseCase = __decorate([
    Injectable(),
    __param(0, Inject(SERVICE_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], UpdateServiceUseCase);
export { UpdateServiceUseCase };
