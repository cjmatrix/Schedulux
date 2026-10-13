import { Inject, Injectable } from '@nestjs/common';
import { SERVICE_REPOSITORY } from '../../../domain/tokens.js';
import { IServiceRepository } from '../../../domain/repositories/service.repository.interface.js';
import { ServiceEntity } from '../../../domain/entities/service.entity.js';
import { PriceVO } from '../../../domain/value-objects/price.vo.js';
import { DepositVO } from '../../../domain/value-objects/deposit.vo.js';
import { generateSemanticId } from '../../../domain/utils/id-generator.js';
import { ICreateServiceUseCase } from '../../interfaces/service-use-cases.interface.js';
import { CreateServiceRequest } from '@repo/proto/scheduling';

@Injectable()
export class CreateServiceUseCase implements ICreateServiceUseCase {
  constructor(
    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: IServiceRepository,
  ) {}

  async execute(dto: CreateServiceRequest): Promise<ServiceEntity> {
    const serviceId = generateSemanticId('srv', dto.name);

    const price = PriceVO.create(
      dto.price?.type,
      dto.price?.amount,
      dto.price?.currency,
    );

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
}
