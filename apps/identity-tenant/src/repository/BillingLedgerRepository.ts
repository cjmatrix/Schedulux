import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { nanoid } from 'nanoid';
import {
  IBillingLedgerRepository,
  RecordBillingLedgerInput,
} from '../interfaces/IBillingLedgerRepository.js';
import type { IUnitOfWork } from '../interfaces/IUnitOfWork.js';
import { BillingLedgerModel, IBillingLedger } from '../model/BillingLedger.js';
import { BaseRepository } from './BaseRepository.js';

@Injectable()
export class BillingLedgerRepository
  extends BaseRepository<IBillingLedger>
  implements IBillingLedgerRepository
{
  private readonly _logger = new Logger(BillingLedgerRepository.name);

  constructor(
    @Optional()
    @Inject('IUnitOfWork')
    unitOfWork?: IUnitOfWork,
  ) {
    super(BillingLedgerModel, unitOfWork);
  }

  async recordEntry(input: RecordBillingLedgerInput): Promise<IBillingLedger> {
    try {
      const session = this.unitOfWork?.getSession();
      const id = input._id || `ledg_${nanoid(21)}`;

   
      const entry = await this.model
        .findOneAndUpdate(
          { event_id: input.event_id },
          {
            $setOnInsert: {
              _id: id,
              tenant_id: input.tenant_id,
              event_type: input.event_type,
              event_id: input.event_id,
              provider: input.provider || 'paddle',
              amount: input.amount ?? 0,
              currency: input.currency || 'USD',
              tier: input.tier,
              status: input.status,
              paddle_customer_id: input.paddle_customer_id,
              paddle_subscription_id: input.paddle_subscription_id,
              paddle_transaction_id: input.paddle_transaction_id,
              details: input.details || {},
              created_at: new Date(),
            },
          },
          {
            upsert: true,
            returnDocument: 'after',
            session,
            setDefaultsOnInsert: true,
          },
        )
        .exec();

      this._logger.log(
        `Recorded billing ledger entry ${entry?._id} for tenant ${input.tenant_id} (event: ${input.event_type})`,
      );
      return entry as unknown as IBillingLedger;
    } catch (err: any) {
      this._logger.error(
        `Failed to record billing ledger entry for event_id ${input.event_id}:`,
        err,
      );
      throw err;
    }
  }

  async findByEventId(eventId: string): Promise<IBillingLedger | null> {
    const session = this.unitOfWork?.getSession();
    return this.model.findOne({ event_id: eventId }, null, { session }).exec();
  }

  async findByTenantId(tenantId: string, limit = 50): Promise<IBillingLedger[]> {
    return this.model
      .find({ tenant_id: tenantId })
      .sort({ created_at: -1 })
      .limit(limit)
      .exec();
  }
}
