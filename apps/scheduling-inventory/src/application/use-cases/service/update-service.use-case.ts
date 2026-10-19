import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SERVICE_REPOSITORY } from '../../../domain/tokens.js';
import { IServiceRepository } from '../../../domain/repositories/service.repository.interface.js';
import { ServiceEntity } from '../../../domain/entities/service.entity.js';
import { PriceVO } from '../../../domain/value-objects/price.vo.js';
import { DepositVO } from '../../../domain/value-objects/deposit.vo.js';
import { IUpdateServiceUseCase } from '../../interfaces/service-use-cases.interface.js';
import { SchedulingEventsProducer } from '../../../infrastructure/messaging/scheduling-events.producer.js';
import { UpdateServiceRequest } from '@repo/proto/scheduling';

@Injectable()
export class UpdateServiceUseCase implements IUpdateServiceUseCase {
  constructor(
    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: IServiceRepository,
    private readonly eventsProducer: SchedulingEventsProducer,
  ) {}

  async execute(dto: UpdateServiceRequest): Promise<ServiceEntity> {
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
      bookingMode: dto.booking_mode,
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

   
    await this.eventsProducer.emitServiceUpdated(updated);

    return updated;
  }
}
