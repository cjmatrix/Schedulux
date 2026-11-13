import mongoose, { Document, Schema } from 'mongoose';
import { nanoid } from 'nanoid';

export type BillingLedgerProvider = 'paddle' | 'stripe' | 'manual';

export interface IBillingLedger extends Document<string> {
  _id: string;
  tenant_id: string;
  event_type: string;
  event_id: string;
  provider: BillingLedgerProvider;
  amount: number;
  currency: string;
  tier?: string;
  status: string;
  paddle_customer_id?: string;
  paddle_subscription_id?: string;
  paddle_transaction_id?: string;
  details?: Record<string, unknown>;
  created_at: Date;
}

const billingLedgerSchema = new Schema<IBillingLedger>(
  {
    _id: { type: String },
    tenant_id: { type: String, required: true, index: true },
    event_type: { type: String, required: true, index: true },
    event_id: { type: String, required: true, unique: true, index: true },
    provider: { type: String, enum: ['paddle', 'stripe', 'manual'], default: 'paddle' },
    amount: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    tier: { type: String, default: null },
    status: { type: String, required: true, default: 'completed' },
    paddle_customer_id: { type: String, default: null },
    paddle_subscription_id: { type: String, default: null },
    paddle_transaction_id: { type: String, default: null },
    details: { type: Schema.Types.Mixed, default: {} },
    created_at: { type: Date, default: Date.now, index: true },
  },
  {
    collection: 'billing_ledgers',
    timestamps: { createdAt: 'created_at', updatedAt: false },
    versionKey: false,
  },
);

billingLedgerSchema.pre('save', function () {
  if (this.isNew && !this._id) {
    this._id = `ledg_${nanoid(21)}`;
  }
});

billingLedgerSchema.index({ tenant_id: 1, created_at: -1 });

export const BillingLedgerModel = mongoose.model<IBillingLedger>(
  'BillingLedger',
  billingLedgerSchema,
);

