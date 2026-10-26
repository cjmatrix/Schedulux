import mongoose, { Document, Schema } from 'mongoose';

export interface IBookingDoc extends Document<string> {
  _id: string;
  booking_reference: string;
  tenant_id: string;
  agent_id: string;
  service_id: string;
  resource_id: string | null;
  resource_ids: string[];
  assigned_asset_ids: string[];
  customer_id: string;
  customer_snapshot: {
    name: string;
    phone: string;
    email: string;
  };
  booking_mode: string;
  start_time: Date;
  end_time: Date;
  effective_end_time: Date;
  buffer_minutes: number;
  duration_minutes: number;
  source: string;
  status: string;
  deposit_status: string;
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
  notes: string;
  created_by: string;
  is_deleted: boolean;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export const BookingMongooseSchema = new Schema<IBookingDoc>(
  {
    _id: { type: String, required: true },
    booking_reference: { type: String, required: true, trim: true, index: true },
    tenant_id: { type: String, required: true, index: true },
    agent_id: { type: String, default: '', index: true },
    service_id: { type: String, required: true, index: true },
    resource_id: { type: String, default: null, index: true },
    resource_ids: { type: [String], default: [], index: true },
    assigned_asset_ids: { type: [String], default: [], index: true },
    customer_id: { type: String, required: true, index: true },
    customer_snapshot: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      email: { type: String, default: '', trim: true },
    },
    booking_mode: {
      type: String,
      enum: ['time_slot', 'date_range'],
      default: 'time_slot',
    },
    start_time: { type: Date, required: true, index: true },
    end_time: { type: Date, required: true, index: true },
    effective_end_time: { type: Date, required: true, index: true },
    buffer_minutes: { type: Number, default: 0 },
    duration_minutes: { type: Number, required: true, min: 0 },
    source: {
      type: String,
      enum: ['manual', 'customer_agent', 'web_portal'],
      default: 'manual',
      index: true,
    },
    status: {
      type: String,
      enum: ['confirmed', 'pending_deposit', 'cancelled', 'completed', 'no_show'],
      default: 'confirmed',
      index: true,
    },
    deposit_status: {
      type: String,
      enum: ['not_required', 'pending', 'verified', 'waived'],
      default: 'not_required',
      index: true,
    },
    price: {
      type: { type: String, default: 'fixed' },
      amount: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
    },
    deposit: {
      required: { type: Boolean, default: false },
      amount: { type: Number, default: 0 },
      processor: { type: String, default: 'direct_upi' },
      upi_id: { type: String, default: '' },
      qr_code_url: { type: String, default: '' },
      confirmation_method: { type: String, default: 'manual_verification' },
      payment_instructions: { type: String, default: '' },
    },
    notes: { type: String, default: '', trim: true },
    created_by: { type: String, default: '', trim: true },
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'bookings',
  },
);

BookingMongooseSchema.index({ tenant_id: 1, booking_reference: 1 }, { unique: true });
BookingMongooseSchema.index({ tenant_id: 1, resource_id: 1, start_time: 1, end_time: 1 });
BookingMongooseSchema.index({ tenant_id: 1, resource_ids: 1, start_time: 1, end_time: 1 });
BookingMongooseSchema.index({ tenant_id: 1, service_id: 1, start_time: 1 });
BookingMongooseSchema.index({ tenant_id: 1, customer_id: 1, created_at: -1 });

export const BookingModel =
  mongoose.models.Booking ||
  mongoose.model<IBookingDoc>('Booking', BookingMongooseSchema);
