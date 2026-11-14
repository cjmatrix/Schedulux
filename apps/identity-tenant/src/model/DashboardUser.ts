import { Document, model, Schema } from 'mongoose';
import { nanoid } from 'nanoid';

export interface IDashboardUser extends Document<string> {
  _id: string;
  tenant_id: string;
  agent_ids: string[];
  email: string;
  password_hash: string;
  name: string;
  system_role: 'manager';
  status: 'active' | 'suspended';
  created_at: Date;
}

const DashboardUserSchema = new Schema<IDashboardUser>(
  {
    _id: { type: String },
    tenant_id: { type: String, required: true, index: true },
    agent_ids: { type: [String], default: [], index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    name: { type: String, required: true },
    system_role: { type: String, enum: ['manager'], default: 'manager', required: true },
    status: { type: String, enum: ['active', 'suspended'], default: 'active', required: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    versionKey: false,
  },
);

DashboardUserSchema.index({ tenant_id: 1, email: 1 }, { unique: true });

DashboardUserSchema.pre('save', function () {
  if (this.isNew && !this._id) {
    this._id = `usr_${nanoid(21)}`;
  }
});

export const DashboardUser = model<IDashboardUser>('DashboardUser', DashboardUserSchema);
