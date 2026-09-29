import { Schema, model } from 'mongoose';
import { nanoid } from 'nanoid';
const DashboardUserSchema = new Schema({
    _id: { type: String },
    tenant_id: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    name: { type: String, required: true },
    system_role: { type: String, enum: ['owner', 'manager', 'provider'], required: true }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    versionKey: false
});
DashboardUserSchema.pre('save', function () {
    if (this.isNew && !this._id) {
        this._id = `usr_${nanoid(21)}`;
    }
});
export const DashboardUser = model('DashboardUser', DashboardUserSchema);
