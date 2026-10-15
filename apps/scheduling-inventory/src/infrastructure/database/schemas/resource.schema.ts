import mongoose, { Document, Schema } from 'mongoose';

export interface IResourceDoc extends Document<string> {
  _id: string;
  tenant_id: string;
  agent_id: string;
  resource_type: string;
  name: string;
  title: string;
  category: string;
  description: string;
  is_bookable: boolean;
  dispatch_status: string;
  custom_shift_overrides_json: string;
  is_deleted: boolean;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export const ResourceMongooseSchema = new Schema<IResourceDoc>(
  {
    _id: { type: String, required: true },
    tenant_id: { type: String, required: true, index: true },
    agent_id: { type: String, required: true, index: true },
    resource_type: {
      type: String,
      required: true,
      enum: ['staff', 'room', 'chair', 'bay', 'equipment', 'asset', 'vehicle'],
      default: 'staff',
      index: true,
    },
    name: { type: String, required: true, trim: true },
    title: { type: String, default: '', trim: true },
    category: { type: String, default: 'General', trim: true },
    description: { type: String, default: '', trim: true },
    is_bookable: { type: Boolean, default: true, index: true },
    dispatch_status: {
      type: String,
      enum: ['active', 'on_leave', 'maintenance', 'retired', 'inactive'],
      default: 'active',
      index: true,
    },
    custom_shift_overrides_json: { type: String, default: '{}' },
    is_deleted: { type: Boolean, default: false, index: true },
    deleted_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  },
);

ResourceMongooseSchema.index(
  { tenant_id: 1, agent_id: 1, name: 1 },
  { unique: true, partialFilterExpression: { is_deleted: { $eq: false } } },
);
ResourceMongooseSchema.index({ tenant_id: 1, agent_id: 1, resource_type: 1, is_bookable: 1, is_deleted: 1 });
ResourceMongooseSchema.index({ agent_id: 1, is_bookable: 1, is_deleted: 1 });

export const ResourceModel = mongoose.model<IResourceDoc>('Resource', ResourceMongooseSchema);
