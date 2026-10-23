import { Inject, Injectable } from '@nestjs/common';
import type { ClientSession } from 'mongoose';
import type {
  CreateOutboxEventParams,
  IOutboxRepository,
} from '../../../domain/repositories/outbox.repository.interface.js';
import type { IUnitOfWork } from '../../../domain/repositories/unit-of-work.interface.js';
import { UNIT_OF_WORK } from '../../../domain/tokens.js';
import { IOutboxDoc, OutboxModel, OutboxStatus } from '../schemas/outbox.schema.js';

export type { CreateOutboxEventParams };

@Injectable()
export class OutboxRepository implements IOutboxRepository {
  constructor(
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async saveEvent(
    params: CreateOutboxEventParams,
    explicitSession?: ClientSession,
  ): Promise<IOutboxDoc> {
    const session = explicitSession || this.unitOfWork?.getSession();
    const docData = {
      _id: params.eventId,
      aggregate_type: params.aggregateType,
      aggregate_id: params.aggregateId,
      event_type: params.eventType,
      topic: params.topic,
      partition_key: params.partitionKey,
      payload: params.payload,
      status: 'PENDING' as OutboxStatus,
      retry_count: 0,
      created_at: new Date(),
    };

    if (session) {
      const [created] = await OutboxModel.create([docData], { session });
      return created;
    }

    return OutboxModel.create(docData);
  }

  async fetchPending(limit = 50): Promise<IOutboxDoc[]> {
    return OutboxModel.find({ status: 'PENDING' }).sort({ created_at: 1 }).limit(limit).exec();
  }

  async markPublished(eventIds: string[]): Promise<void> {
    if (!eventIds.length) return;
    await OutboxModel.updateMany(
      { _id: { $in: eventIds } },
      {
        $set: {
          status: 'PUBLISHED',
          published_at: new Date(),
          error_message: null,
        },
      },
    ).exec();
  }

  async markFailed(eventId: string, errorMessage: string): Promise<void> {
    const doc = await OutboxModel.findById(eventId).exec();
    if (!doc) return;

    const newRetryCount = (doc.retry_count || 0) + 1;
    const newStatus: OutboxStatus = newRetryCount >= 5 ? 'FAILED' : 'PENDING';

    await OutboxModel.updateOne(
      { _id: eventId },
      {
        $set: {
          status: newStatus,
          retry_count: newRetryCount,
          error_message: errorMessage,
        },
      },
    ).exec();
  }
}
