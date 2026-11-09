import mongoose, { Document, Schema } from 'mongoose';

export interface ITierConfigDoc extends Document<string> {
  _id: string;
  tier: string;
  name: string;
  max_agents: number;
  max_services: number;
  max_resources: number;
  max_kb_docs: number;
  max_kb_doc_size_mb: number;
  weekly_token_limit: number;
  rate_limit_rpm: number;
  status: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

const tierConfigSchema = new Schema<ITierConfigDoc>(
  {
    _id: { type: String, required: true },
    tier: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    max_agents: { type: Number, required: true, default: 1 },
    max_services: { type: Number, required: true, default: 5 },
    max_resources: { type: Number, required: true, default: 3 },
    max_kb_docs: { type: Number, required: true, default: 3 },
    max_kb_doc_size_mb: { type: Number, required: true, default: 5 },
    weekly_token_limit: { type: Number, required: true, default: 100000 },
    rate_limit_rpm: { type: Number, required: true, default: 60 },
    status: { type: String, required: true, default: 'active' },
    description: { type: String, default: '' },
  },
  {
    collection: 'tier_configs',
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  },
);

export const TierConfigModel = mongoose.model<ITierConfigDoc>('TierConfig', tierConfigSchema);
