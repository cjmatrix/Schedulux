import { Inject, Injectable } from '@nestjs/common';
import { CreateServiceRequest } from '@repo/proto/scheduling';
import { ServiceEntity } from '../../../domain/entities/service.entity.js';
import { IServiceRepository } from '../../../domain/repositories/service.repository.interface.js';
import type { IUnitOfWork } from '../../../domain/repositories/unit-of-work.interface.js';
import {
  SCHEDULING_EVENTS_PRODUCER,
  SERVICE_REPOSITORY,
  UNIT_OF_WORK,
} from '../../../domain/tokens.js';
import { generateSemanticId } from '../../../domain/utils/id-generator.js';
import { DepositVO } from '../../../domain/value-objects/deposit.vo.js';
import { PriceVO } from '../../../domain/value-objects/price.vo.js';
import type { ISchedulingEventsProducer } from '../../interfaces/scheduling-events-producer.interface.js';
import { ICreateServiceUseCase } from '../../interfaces/service-use-cases.interface.js';

@Injectable()
export class CreateServiceUseCase implements ICreateServiceUseCase {
  constructor(
    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: IServiceRepository,
    @Inject(SCHEDULING_EVENTS_PRODUCER)
    private readonly eventsProducer: ISchedulingEventsProducer,
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(dto: CreateServiceRequest): Promise<ServiceEntity> {
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
      agentId: dto.agent_id || '',
      name: dto.name,
      category: dto.category || 'General',
      description: dto.description || '',
      durationMinutes: dto.duration_minutes || 30,
      bufferMinutes: dto.buffer_minutes || 0,
      allocationModel: dto.allocation_model || 'single_resource',
      bookingMode: dto.booking_mode || 'time_slot',
      price,
      deposit,
      verification: dto.verification ? { require_otp: dto.verification.require_otp } : undefined,
      eligibleResourceIds: dto.eligible_resource_ids ?? [],
      requiredAssetIds: dto.required_asset_ids ?? [],
      recallIntervalDays: dto.recall_interval_days || 0,
    });

    const { created, outbox } = await this.unitOfWork.withTransaction(async () => {
      const createdEntity = await this.serviceRepository.create(service);
      const outboxDoc = await this.eventsProducer.createServiceCreatedOutboxEvent(createdEntity);
      return { created: createdEntity, outbox: outboxDoc };
    });

    await this.eventsProducer.publishOutboxEvent(outbox);

    return created;
  }
}
