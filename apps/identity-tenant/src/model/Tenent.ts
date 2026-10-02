import mongoose, { Document } from 'mongoose'
import { nanoid } from 'nanoid'

export interface ITenant extends Document<string>{
  _id: string;
  business_name: string;
  contact_email: string;
  password_hash?: string;
  auth_provider?: 'local' | 'google';
  google_id?: string;
  timezone: string;
  currency: string;
  tier: string;
  stripe_customer_id?: string;
  status: string;
  monthly_token_limit?: number;
  created_at: Date;
}

const tenantSchema = new mongoose.Schema({
  _id: { type: String },
  business_name: { type: String, required: true, trim: true },
  contact_email: { type: String, required: true, lowercase: true, trim: true, unique: true },
  password_hash: { type: String, required: false, default: '' },
  auth_provider: { type: String, enum: ['local', 'google'], default: 'local' },
  google_id: { type: String, default: null },
  timezone: { type: String, default: 'UTC' },
  currency: { type: String, default: 'USD' },
  tier: { type: String, required: true }, 
  stripe_customer_id: { type: String, default: null },
  status: { type: String, default: 'active' },
  monthly_token_limit: { type: Number, default: null },
  created_at: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  versionKey: false,
})


tenantSchema.pre('save', function () {
  if (this.isNew && !this._id) {
    this._id = `tnt_${nanoid(21)}`;
  }
});

export const Tenent = mongoose.model<ITenant>('Tenant', tenantSchema)

