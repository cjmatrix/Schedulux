import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomerDoc extends Document<string> {
  _id: string;
  tenant_id: string;
  agent_id: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  is_guest: boolean;
  total_bookings: number;
  is_deleted: boolean;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export const CustomerMongooseSchema = new Schema<ICustomerDoc>(
  {
    _id: { type: String, required: true },
    tenant_id: { type: String, required: true, index: true },
    agent_id: { type: String, default: '', index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, default: '', trim: true },
    notes: { type: String, default: '', trim: true },
    is_guest: { type: Boolean, default: false },
    total_bookings: { type: Number, default: 0, min: 0 },
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'customers',
  },
);

CustomerMongooseSchema.index({ tenant_id: 1, agent_id: 1, phone: 1 });
CustomerMongooseSchema.index({ tenant_id: 1, agent_id: 1, email: 1 });
CustomerMongooseSchema.index({ tenant_id: 1, phone: 1 });
CustomerMongooseSchema.index({ tenant_id: 1, email: 1 });

export const CustomerModel =
  mongoose.models.Customer ||
  mongoose.model<ICustomerDoc>('Customer', CustomerMongooseSchema);
