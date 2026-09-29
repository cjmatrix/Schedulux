import mongoose from 'mongoose';
import { nanoid } from 'nanoid';
const tenantSchema = new mongoose.Schema({
    _id: { type: String },
    business_name: { type: String, required: true, trim: true },
    contact_email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    password_hash: { type: String, required: true },
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
});
tenantSchema.pre('save', function () {
    if (this.isNew && !this._id) {
        this._id = `tnt_${nanoid(21)}`;
    }
});
export const Tenent = mongoose.model('Tenant', tenantSchema);
