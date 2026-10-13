import mongoose, { Schema } from 'mongoose';
export const ResourceMongooseSchema = new Schema({
    _id: { type: String, required: true },
    tenant_id: { type: String, required: true, index: true },
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
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
});
ResourceMongooseSchema.index({ tenant_id: 1, name: 1 }, { unique: true });
ResourceMongooseSchema.index({ tenant_id: 1, resource_type: 1, is_bookable: 1 });
export const ResourceModel = mongoose.model('Resource', ResourceMongooseSchema);
