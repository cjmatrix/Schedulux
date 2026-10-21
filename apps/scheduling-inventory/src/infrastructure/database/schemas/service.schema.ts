import mongoose, { Document, Schema } from 'mongoose';

export interface IServiceDoc extends Document<string> {
  _id: string;
  tenant_id: string;
  agent_id: string;
  name: string;
  category: string;
  description: string;
  duration_minutes: number;
  buffer_minutes: number;
  allocation_model: string;
  booking_mode: string;
  price: {
    type: string;
    amount: number;
    currency: string;
  };
  deposit: {
    required: boolean;
    amount: number;
    processor: string;
    upi_id: string;
    qr_code_url: string;
    confirmation_method: string;
    payment_instructions: string;
  };
  verification?: {
    require_otp?: boolean | null;
  };
  eligible_resource_ids: string[];
  required_asset_ids: string[];
  recall_interval_days: number;
  is_deleted: boolean;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export const ServiceMongooseSchema = new Schema<IServiceDoc>(
  {
    _id: { type: String, required: true },
    tenant_id: { type: String, required: true, index: true },
    agent_id: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, default: 'General', trim: true, index: true },
    description: { type: String, default: '', trim: true },
    duration_minutes: { type: Number, required: true, min: 1, default: 30 },
    buffer_minutes: { type: Number, default: 0, min: 0 },
    allocation_model: {
      type: String,
      enum: ['single_resource', 'multi_resource', 'pooled', 'asset_only'],
      default: 'single_resource',
    },
    booking_mode: {
      type: String,
      enum: ['time_slot', 'date_range'],
      default: 'time_slot',
    },
    price: {
      type: {
        type: String,
        enum: ['fixed', 'starting_at', 'hourly', 'free', 'custom'],
        default: 'fixed',
      },
      amount: { type: Number, default: 0, min: 0 },
      currency: { type: String, default: 'USD', uppercase: true },
    },
    deposit: {
      required: { type: Boolean, default: false },
      amount: { type: Number, default: 0, min: 0 },
      processor: { type: String, default: '' },
      upi_id: { type: String, default: '' },
      qr_code_url: { type: String, default: '' },
      confirmation_method: { type: String, default: 'automatic' },
      payment_instructions: { type: String, default: '' },
    },
    verification: {
      require_otp: { type: Boolean, default: null },
    },
    eligible_resource_ids: { type: [String], default: [] },
    required_asset_ids: { type: [String], default: [] },
    recall_interval_days: { type: Number, default: 0 },
    is_deleted: { type: Boolean, default: false, index: true },
    deleted_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  },
);

ServiceMongooseSchema.index(
  { tenant_id: 1, agent_id: 1, name: 1 },
  { unique: true, partialFilterExpression: { is_deleted: { $eq: false } } },
);
ServiceMongooseSchema.index({ tenant_id: 1, agent_id: 1, category: 1, is_deleted: 1 });
ServiceMongooseSchema.index({ agent_id: 1, category: 1, is_deleted: 1 });

export const ServiceModel = mongoose.model<IServiceDoc>('Service', ServiceMongooseSchema);
