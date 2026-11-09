import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import type { VerifyCustomerRequest, VerifyCustomerResponse } from '@repo/proto/scheduling';
import type { ICustomerRepository } from '../../../domain/repositories/customer.repository.interface.js';
import { CUSTOMER_REPOSITORY } from '../../../domain/tokens.js';
import type { IVerifyCustomerUseCase } from '../../interfaces/booking-use-cases.interface.js';

@Injectable()
export class VerifyCustomerUseCase implements IVerifyCustomerUseCase {
  private readonly _logger = new Logger(VerifyCustomerUseCase.name);

  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly _customerRepository: ICustomerRepository,
  ) {}

  async execute(dto: VerifyCustomerRequest): Promise<VerifyCustomerResponse> {
    const phone = dto.customer_phone?.trim();
    if (!phone) {
      throw new BadRequestException('customer_phone is required for verification');
    }

    const tenantId = dto.tenant_id?.trim() || 'default';
    const agentId = dto.agent_id?.trim() || undefined;

    const updatedCount = await this._customerRepository.markVerifiedByPhone(
      tenantId,
      phone,
      agentId,
    );

    this._logger.log(
      `[VerifyCustomerUseCase] Customer verified (phone: ${phone}, agent: ${agentId || 'any'}, count: ${updatedCount})`,
    );

    return {
      success: true,
      message: `Successfully verified customer with phone ${phone}`,
      updated_count: updatedCount,
    };
  }
}
