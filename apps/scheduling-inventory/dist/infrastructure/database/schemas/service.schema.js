import mongoose, { Schema } from 'mongoose';
export const ServiceMongooseSchema = new Schema({
    _id: { type: String, required: true },
    tenant_id: { type: String, required: true, index: true },
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
    eligible_resource_ids: { type: [String], default: [] },
    required_asset_ids: { type: [String], default: [] },
    recall_interval_days: { type: Number, default: 0 },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
});
ServiceMongooseSchema.index({ tenant_id: 1, name: 1 }, { unique: true });
ServiceMongooseSchema.index({ tenant_id: 1, category: 1 });
export const ServiceModel = mongoose.model('Service', ServiceMongooseSchema);
