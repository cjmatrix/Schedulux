import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateServiceRequest } from '@repo/proto/scheduling';
import { ServiceEntity } from '../../../domain/entities/service.entity.js';
import { IServiceRepository } from '../../../domain/repositories/service.repository.interface.js';
import type { IUnitOfWork } from '../../../domain/repositories/unit-of-work.interface.js';
import {
  SCHEDULING_EVENTS_PRODUCER,
  SERVICE_REPOSITORY,
  UNIT_OF_WORK,
} from '../../../domain/tokens.js';
import { DepositVO } from '../../../domain/value-objects/deposit.vo.js';
import { PriceVO } from '../../../domain/value-objects/price.vo.js';
import type { ISchedulingEventsProducer } from '../../interfaces/scheduling-events-producer.interface.js';
import { IUpdateServiceUseCase } from '../../interfaces/service-use-cases.interface.js';

@Injectable()
export class UpdateServiceUseCase implements IUpdateServiceUseCase {
  constructor(
    @Inject(SERVICE_REPOSITORY)
    private readonly _serviceRepository: IServiceRepository,
    @Inject(SCHEDULING_EVENTS_PRODUCER)
    private readonly _eventsProducer: ISchedulingEventsProducer,
    @Inject(UNIT_OF_WORK)
    private readonly _unitOfWork: IUnitOfWork,
  ) {}

  async execute(dto: UpdateServiceRequest): Promise<ServiceEntity> {
    const existing = await this._serviceRepository.findById(dto.tenant_id, dto.service_id);
    if (!existing) {
      throw new NotFoundException(
        `Service ${dto.service_id} not found for tenant ${dto.tenant_id}`,
      );
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
      bookingMode: dto.booking_mode,
      price,
      deposit,
      verification: dto.verification ? { require_otp: dto.verification.require_otp } : undefined,
      resourceRequirements: dto.resource_requirements?.length
        ? dto.resource_requirements.map((r) => ({
            role: r.role || 'Staff',
            resourceType: r.resource_type || 'staff',
            count: r.count || 1,
            eligibleResourceIds: r.eligible_resource_ids ?? [],
            selectionMode:
              (r.selection_mode as 'user_selectable' | 'auto_assign') ||
              (r.resource_type === 'staff' ? 'user_selectable' : 'auto_assign'),
          }))
        : undefined,
      recallIntervalDays: dto.recall_interval_days,
    });

    const { updated, outbox } = await this._unitOfWork.withTransaction(async () => {
      const updatedEntity = await this._serviceRepository.update(existing);
      if (!updatedEntity) {
        throw new NotFoundException(`Failed to update service ${dto.service_id}`);
      }
      const outboxDoc = await this._eventsProducer.createServiceUpdatedOutboxEvent(updatedEntity);
      return { updated: updatedEntity, outbox: outboxDoc };
    });

    await this._eventsProducer.publishOutboxEvent(outbox);

    return updated;
  }
}
