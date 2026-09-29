import mongoose, { Schema } from 'mongoose';
const superAdminSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password_hash: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    role: {
        type: String,
        default: 'super_admin',
    },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    versionKey: false,
});
export const SuperAdmin = mongoose.model('SuperAdmin', superAdminSchema);
