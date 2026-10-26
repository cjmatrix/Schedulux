import mongoose, { Document, Schema } from 'mongoose';

export type OutboxStatus = 'PENDING' | 'PUBLISHED' | 'FAILED';

export interface IOutboxDoc extends Document<string> {
  _id: string;
  aggregate_type: 'service' | 'resource' | 'booking';
  aggregate_id: string;
  event_type: string;
  topic: string;
  partition_key: string;
  payload: Record<string, unknown>;
  status: OutboxStatus;
  retry_count: number;
  error_message?: string | null;
  created_at: Date;
  published_at?: Date | null;
}

export const OutboxMongooseSchema = new Schema<IOutboxDoc>(
  {
    _id: { type: String, required: true },
    aggregate_type: {
      type: String,
      required: true,
      enum: ['service', 'resource', 'booking'],
      index: true,
    },
    aggregate_id: { type: String, required: true, index: true },
    event_type: { type: String, required: true, index: true },
    topic: { type: String, required: true },
    partition_key: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      required: true,
      enum: ['PENDING', 'PUBLISHED', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    retry_count: { type: Number, default: 0 },
    error_message: { type: String, default: null },
    published_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    versionKey: false,
  },
);

OutboxMongooseSchema.index({ status: 1, created_at: 1 });

OutboxMongooseSchema.index(
  { published_at: 1 },
  { expireAfterSeconds: 604800, partialFilterExpression: { status: 'PUBLISHED' } },
);

export const OutboxModel = mongoose.model<IOutboxDoc>('OutboxEvent', OutboxMongooseSchema);
