import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISuperAdmin extends Document {
  _id: Types.ObjectId;
  email: string;
  password_hash: string;
  name: string;
  role: string;
  created_at: Date;
}

const superAdminSchema = new Schema<ISuperAdmin>(
  {
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
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    versionKey: false,
  },
);

export const SuperAdmin = mongoose.model<ISuperAdmin>('SuperAdmin', superAdminSchema);
