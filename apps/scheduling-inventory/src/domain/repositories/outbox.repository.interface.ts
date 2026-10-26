import type { ClientSession } from 'mongoose';
import type { IOutboxDoc } from '../../infrastructure/database/schemas/outbox.schema.js';

export interface CreateOutboxEventParams {
  eventId: string;
  aggregateType: 'service' | 'resource' | 'booking';
  aggregateId: string;
  eventType: string;
  topic: string;
  partitionKey: string;
  payload: Record<string, any>;
}

export interface IOutboxRepository {
  saveEvent(params: CreateOutboxEventParams, explicitSession?: ClientSession): Promise<IOutboxDoc>;
  fetchPending(limit?: number): Promise<IOutboxDoc[]>;
  markPublished(eventIds: string[]): Promise<void>;
  markFailed(eventId: string, errorMessage: string): Promise<void>;
}
