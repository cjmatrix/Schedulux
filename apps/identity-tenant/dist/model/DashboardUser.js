import { model, Schema } from 'mongoose';
import { nanoid } from 'nanoid';
const DashboardUserSchema = new Schema({
    _id: { type: String },
    tenant_id: { type: String, required: true, index: true },
    agent_ids: { type: [String], default: [], index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    name: { type: String, required: true },
    system_role: { type: String, enum: ['manager'], default: 'manager', required: true },
    status: { type: String, enum: ['active', 'suspended'], default: 'active', required: true },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    versionKey: false,
});
DashboardUserSchema.index({ tenant_id: 1, email: 1 }, { unique: true });
DashboardUserSchema.pre('save', function () {
    if (this.isNew && !this._id) {
        this._id = `usr_${nanoid(21)}`;
    }
});
export const DashboardUser = model('DashboardUser', DashboardUserSchema);
