import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import type { VerifyCustomerRequest, VerifyCustomerResponse } from '@repo/proto/scheduling';
import { generateSemanticId } from '../../../domain/utils/id-generator.js';
import { CustomerModel } from '../../../infrastructure/database/schemas/customer.schema.js';
import type { IVerifyCustomerUseCase } from '../../interfaces/booking-use-cases.interface.js';

@Injectable()
export class VerifyCustomerUseCase implements IVerifyCustomerUseCase {
  private readonly _logger = new Logger(VerifyCustomerUseCase.name);

  async execute(dto: VerifyCustomerRequest): Promise<VerifyCustomerResponse> {
    const phone = dto.customer_phone?.trim();
    if (!phone) {
      throw new BadRequestException('customer_phone is required for verification');
    }

    const last10 = phone.length >= 10 ? phone.slice(-10) : phone;
    const query: Record<string, unknown> = {
      is_deleted: { $ne: true },
      $or: [
        { phone },
        { phone: `+91${last10}` },
        { phone: last10 },
      ],
    };

    if (dto.tenant_id?.trim()) {
      query.tenant_id = dto.tenant_id.trim();
    }

    const result = await CustomerModel.updateMany(query, {
      $set: {
        is_guest: false,
        updated_at: new Date(),
      },
    }).exec();

    let updatedCount = result.modifiedCount;
    if (result.matchedCount === 0) {
      await CustomerModel.create({
        _id: generateSemanticId('cus', phone),
        tenant_id: dto.tenant_id?.trim() || 'default',
        phone,
        name: 'Guest',
        is_guest: false,
        total_bookings: 0,
        is_deleted: false,
      });
      updatedCount = 1;
      this._logger.log(
        `[VerifyCustomerUseCase] Pre-created verified customer record for phone: ${phone}`,
      );
    } else {
      this._logger.log(
        `[VerifyCustomerUseCase] Marked ${result.modifiedCount} customer record(s) verified (phone: ${phone})`,
      );
    }

    return {
      success: true,
      message: `Successfully verified customer with phone ${phone}`,
      updated_count: updatedCount,
    };
  }
}
